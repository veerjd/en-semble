/**
 * In-memory stand-in for the service-role Supabase client.
 *
 * Implements just the PostgREST query-builder subset the server actions
 * use (select/insert/update/delete, eq/neq/is/in/lt/or, order/limit,
 * single/maybeSingle, embedded resources), plus auth.admin.*,
 * auth.signInWithPassword and the respond_to_match RPC — the latter
 * mirroring supabase/migrations/20260729120000_schema.sql so the full
 * user journey can run against the real action code.
 */
import { randomUUID } from 'node:crypto'
import type { Tables } from '~~/shared/types/database.types'

type Row = Record<string, unknown>

export interface FakeStore {
    spaces: Tables<'spaces'>[]
    users: Tables<'users'>[]
    interests: Tables<'interests'>[]
    user_interests: Tables<'user_interests'>[]
    matches: Tables<'matches'>[]
    chats: Tables<'chats'>[]
    chat_messages: Tables<'chat_messages'>[]
    invites: Tables<'invites'>[]
}

type TableName = keyof FakeStore

export interface FakeAuthUser {
    id: string
    email: string
    password: string
}

interface QueryResult {
    data: unknown
    error: { code?: string; message: string } | null
}

/**
 * Strictly monotonic clock so rows created in the same millisecond still
 * order deterministically by created_at (as they do in Postgres).
 */
let lastTick = 0
export const nowIso = (): string => {
    lastTick = Math.max(lastTick + 1, Date.now())
    return new Date(lastTick).toISOString()
}

const defaultsFor = (table: TableName): Row => {
    switch (table) {
        case 'spaces':
            return {
                id: randomUUID(),
                description: null,
                created_at: nowIso(),
                deleted_at: null,
            }
        case 'users': {
            const created = nowIso()
            return {
                id: randomUUID(),
                bio: null,
                locale: 'fr',
                created_at: created,
                last_active: created,
                deleted_at: null,
            }
        }
        case 'interests':
            return {
                id: randomUUID(),
                interest_category_id: null,
                created_by: null,
                created_at: nowIso(),
            }
        case 'user_interests':
            return { created_at: nowIso() }
        case 'matches':
            return {
                id: randomUUID(),
                user1_response: 'pending',
                user2_response: 'pending',
                created_at: nowIso(),
                deleted_at: null,
            }
        case 'chats':
            return { id: randomUUID(), created_at: nowIso(), deleted_at: null }
        case 'chat_messages':
            return {
                id: randomUUID(),
                read_at: null,
                created_at: nowIso(),
                deleted_at: null,
            }
        case 'invites':
            return {
                id: randomUUID(),
                email: null,
                created_by: null,
                used_at: null,
                used_by: null,
                created_at: nowIso(),
            }
    }
}

/** Unique constraints the actions rely on (23505 handling). */
const UNIQUE: Partial<Record<TableName, string[][]>> = {
    spaces: [['slug']],
    users: [['id'], ['username']],
    interests: [['slug']],
    user_interests: [['user_id', 'interest_id']],
    matches: [['user1_id', 'user2_id']],
    chats: [['match_id']],
    invites: [['token_hash']],
}

interface Rel {
    table: TableName
    local: string
    foreign: string
    many: boolean
}

const one = (table: TableName, local: string, foreign = 'id'): Rel => ({
    table,
    local,
    foreign,
    many: false,
})
const many = (table: TableName, foreign: string, local = 'id'): Rel => ({
    table,
    local,
    foreign,
    many: true,
})

/**
 * Embedded-resource relationships, keyed by parent table then by the
 * embed target (`table` or `table!fkey_hint` when the hint disambiguates).
 */
const RELATIONS: Partial<Record<TableName, Record<string, Rel>>> = {
    invites: { spaces: one('spaces', 'space_id') },
    users: {
        spaces: one('spaces', 'space_id'),
        user_interests: many('user_interests', 'user_id'),
    },
    user_interests: { interests: one('interests', 'interest_id') },
    matches: {
        'users!matches_user1_id_fkey': one('users', 'user1_id'),
        'users!matches_user2_id_fkey': one('users', 'user2_id'),
        chats: many('chats', 'match_id'),
    },
    chats: { matches: one('matches', 'match_id') },
}

/** Split a select string on top-level commas (embeds keep their parens). */
const splitTopLevel = (sel: string): string[] => {
    const parts: string[] = []
    let depth = 0
    let current = ''
    for (const ch of sel) {
        if (ch === '(') depth++
        if (ch === ')') depth--
        if (ch === ',' && depth === 0) {
            parts.push(current.trim())
            current = ''
        } else {
            current += ch
        }
    }
    if (current.trim()) parts.push(current.trim())
    return parts.filter(Boolean)
}

const INNER_MISS = Symbol('inner-embed-miss')

const EMBED_RE = /^(?:(\w+):)?(\w+)(!\w+)?\(([\s\S]*)\)$/

/** Project a row through a PostgREST select string, resolving embeds. */
const project = (
    store: FakeStore,
    table: TableName,
    row: Row,
    sel: string,
): Row | typeof INNER_MISS => {
    if (sel.trim() === '*') return { ...row }
    const out: Row = {}
    for (const part of splitTopLevel(sel)) {
        const embed = part.match(EMBED_RE)
        if (!embed) {
            if (part === '*') Object.assign(out, row)
            else out[part] = row[part]
            continue
        }
        const [, alias, relName, hint, inner] = embed
        const rel =
            RELATIONS[table]?.[`${relName}${hint ?? ''}`] ??
            RELATIONS[table]?.[relName!]
        if (!rel) {
            throw new Error(`fake db: unknown embed ${table} -> ${part}`)
        }
        const related = (store[rel.table] as Row[]).filter(
            (r) => r[rel.foreign] === row[rel.local],
        )
        if (hint === '!inner' && related.length === 0) return INNER_MISS
        const projected: Row[] = []
        for (const r of related) {
            const p = project(store, rel.table, r, inner || '*')
            if (p !== INNER_MISS) projected.push(p)
        }
        out[alias ?? relName!] = rel.many ? projected : projected[0] ?? null
    }
    return out
}

const uniqueViolation = (
    rows: Row[],
    table: TableName,
    candidate: Row,
): string | null => {
    for (const cols of UNIQUE[table] ?? []) {
        const clash = rows.some((r) =>
            cols.every((col) => r[col] !== null && r[col] === candidate[col]),
        )
        if (clash) return `${table}_${cols.join('_')}_key`
    }
    return null
}

class FakeQueryBuilder implements PromiseLike<QueryResult> {
    private op: 'select' | 'insert' | 'update' | 'delete' = 'select'
    private inputRows: Row[] = []
    private patch: Row = {}
    private sel: string | null = null
    private filters: ((row: Row) => boolean)[] = []
    private ord: { col: string; asc: boolean } | null = null
    private lim: number | null = null
    private mode: 'many' | 'single' | 'maybeSingle' = 'many'

    constructor(
        private readonly db: FakeSupabase,
        private readonly table: TableName,
    ) {}

    select(sel = '*') {
        this.sel = sel
        return this
    }

    insert(rows: Row | Row[]) {
        this.op = 'insert'
        this.inputRows = Array.isArray(rows) ? rows : [rows]
        return this
    }

    update(patch: Row) {
        this.op = 'update'
        this.patch = patch
        return this
    }

    delete() {
        this.op = 'delete'
        return this
    }

    eq(col: string, value: unknown) {
        this.filters.push((r) => r[col] === value)
        return this
    }

    neq(col: string, value: unknown) {
        this.filters.push((r) => r[col] !== value)
        return this
    }

    is(col: string, value: unknown) {
        this.filters.push((r) => r[col] === value)
        return this
    }

    in(col: string, values: unknown[]) {
        this.filters.push((r) => values.includes(r[col]))
        return this
    }

    lt(col: string, value: string) {
        this.filters.push((r) => String(r[col]) < value)
        return this
    }

    /** Supports the `col.eq.value,col.eq.value` disjunctions the code uses. */
    or(expr: string) {
        const disjuncts = expr.split(',').map((clause) => {
            const [col, op, ...rest] = clause.split('.')
            if (op !== 'eq') {
                throw new Error(`fake db: unsupported or() operator ${op}`)
            }
            const value = rest.join('.')
            return (r: Row) => String(r[col!]) === value
        })
        this.filters.push((r) => disjuncts.some((d) => d(r)))
        return this
    }

    order(col: string, opts?: { ascending?: boolean }) {
        this.ord = { col, asc: opts?.ascending ?? true }
        return this
    }

    limit(n: number) {
        this.lim = n
        return this
    }

    single() {
        this.mode = 'single'
        return this
    }

    maybeSingle() {
        this.mode = 'maybeSingle'
        return this
    }

    then<R1 = QueryResult, R2 = never>(
        onFulfilled?: ((value: QueryResult) => R1 | PromiseLike<R1>) | null,
        onRejected?: ((reason: unknown) => R2 | PromiseLike<R2>) | null,
    ): PromiseLike<R1 | R2> {
        return Promise.resolve()
            .then(() => this.exec())
            .then(onFulfilled, onRejected)
    }

    private exec(): QueryResult {
        const store = this.db.store
        const rows = store[this.table] as Row[]

        if (this.op === 'insert') {
            const inserted: Row[] = []
            for (const input of this.inputRows) {
                const row = { ...defaultsFor(this.table), ...input }
                const violated = uniqueViolation(rows, this.table, row)
                if (violated) {
                    return {
                        data: null,
                        error: {
                            code: '23505',
                            message: `duplicate key value violates unique constraint "${violated}"`,
                        },
                    }
                }
                rows.push(row)
                inserted.push(row)
                if (this.table === 'chat_messages') {
                    // Mirrors the update_user_last_active_on_message trigger.
                    const sender = store.users.find((u) => u.id === row.user_id)
                    if (sender) sender.last_active = nowIso()
                }
            }
            return this.finish(inserted)
        }

        const matching = rows.filter((r) => this.filters.every((f) => f(r)))

        if (this.op === 'update') {
            matching.forEach((r) => Object.assign(r, this.patch))
            return this.finish(matching)
        }
        if (this.op === 'delete') {
            ;(store[this.table] as Row[]) = rows.filter(
                (r) => !matching.includes(r),
            ) as never
            return this.finish(matching)
        }
        return this.finish(matching)
    }

    private finish(rows: Row[]): QueryResult {
        if (this.op !== 'select' && this.sel === null) {
            return { data: null, error: null }
        }
        let out: Row[] = []
        for (const row of rows) {
            const projected = project(
                this.db.store,
                this.table,
                row,
                this.sel ?? '*',
            )
            if (projected !== INNER_MISS) out.push(projected)
        }
        if (this.ord) {
            const { col, asc } = this.ord
            out.sort((a, b) => {
                const [x, y] = [String(a[col]), String(b[col])]
                return (x < y ? -1 : x > y ? 1 : 0) * (asc ? 1 : -1)
            })
        }
        if (this.lim !== null) out = out.slice(0, this.lim)
        if (this.mode === 'single') {
            return out.length === 1
                ? { data: out[0], error: null }
                : {
                      data: null,
                      error: {
                          code: 'PGRST116',
                          message: `JSON object requested, ${out.length} rows returned`,
                      },
                  }
        }
        if (this.mode === 'maybeSingle') {
            if (out.length > 1) {
                return {
                    data: null,
                    error: {
                        code: 'PGRST116',
                        message: `JSON object requested, ${out.length} rows returned`,
                    },
                }
            }
            return { data: out[0] ?? null, error: null }
        }
        return { data: out, error: null }
    }
}

const rpcError = (message: string) => ({ data: null, error: { message } })

export class FakeSupabase {
    store: FakeStore = {
        spaces: [],
        users: [],
        interests: [],
        user_interests: [],
        matches: [],
        chats: [],
        chat_messages: [],
        invites: [],
    }

    authUsers: FakeAuthUser[] = []

    from(table: TableName) {
        return new FakeQueryBuilder(this, table)
    }

    auth = {
        admin: {
            createUser: async (attrs: {
                email: string
                password: string
                email_confirm?: boolean
            }) => {
                if (this.authUsers.some((u) => u.email === attrs.email)) {
                    return {
                        data: { user: null },
                        error: {
                            code: 'email_exists',
                            message: 'A user with this email already exists',
                        },
                    }
                }
                const user: FakeAuthUser = {
                    id: randomUUID(),
                    email: attrs.email,
                    password: attrs.password,
                }
                this.authUsers.push(user)
                return {
                    data: { user: { id: user.id, email: user.email } },
                    error: null,
                }
            },
            deleteUser: async (id: string) => {
                this.authUsers = this.authUsers.filter((u) => u.id !== id)
                // FK users.id -> auth.users on delete cascade.
                this.store.users = this.store.users.filter((u) => u.id !== id)
                return { data: { user: null }, error: null }
            },
        },
        signInWithPassword: async (creds: {
            email: string
            password: string
        }) => {
            const user = this.authUsers.find(
                (u) => u.email === creds.email && u.password === creds.password,
            )
            if (!user) {
                return {
                    data: { user: null, session: null },
                    error: {
                        code: 'invalid_credentials',
                        message: 'Invalid login credentials',
                    },
                }
            }
            const sessionUser = { id: user.id, email: user.email }
            return {
                data: {
                    user: sessionUser,
                    session: { access_token: 'fake-jwt', user: sessionUser },
                },
                error: null,
            }
        },
    }

    /** Mirrors the respond_to_match plpgsql function from the schema. */
    async rpc(fn: string, params: Record<string, unknown>) {
        if (fn !== 'respond_to_match') {
            return rpcError(`function ${fn} does not exist`)
        }
        const matchId = params.p_match_id as string
        const userId = params.p_user_id as string
        const response = params.p_response as string

        if (response === 'pending') return rpcError('invalid_response')

        const match = this.store.matches.find(
            (m) => m.id === matchId && m.deleted_at === null,
        )
        if (!match) return rpcError('match_not_found')

        let current: string
        if (userId === match.user1_id) current = match.user1_response
        else if (userId === match.user2_id) current = match.user2_response
        else return rpcError('not_participant')

        if (current !== 'pending' && current !== response) {
            return rpcError('already_responded')
        }

        if (userId === match.user1_id) {
            match.user1_response = response as typeof match.user1_response
        } else {
            match.user2_response = response as typeof match.user2_response
        }

        let chatId: string | null = null
        if (
            match.user1_response === 'accepted' &&
            match.user2_response === 'accepted'
        ) {
            let chat = this.store.chats.find((c) => c.match_id === match.id)
            if (!chat) {
                chat = {
                    id: randomUUID(),
                    match_id: match.id,
                    created_at: nowIso(),
                    deleted_at: null,
                }
                this.store.chats.push(chat)
            }
            chatId = chat.id
        }

        return {
            data: [
                {
                    user1_response: match.user1_response,
                    user2_response: match.user2_response,
                    chat_id: chatId,
                },
            ],
            error: null,
        }
    }
}
