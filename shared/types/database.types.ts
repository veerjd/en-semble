// Database types for the public schema.
// Hand-maintained to match supabase/migrations exactly; regenerate with
// `npm run generate:types` when the local Supabase stack is running.
export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            chat_messages: {
                Row: {
                    id: string
                    chat_id: string
                    user_id: string
                    content: string
                    read_at: string | null
                    created_at: string
                    deleted_at: string | null
                }
                Insert: {
                    id?: string
                    chat_id: string
                    user_id: string
                    content: string
                    read_at?: string | null
                    created_at?: string
                    deleted_at?: string | null
                }
                Update: {
                    id?: string
                    chat_id?: string
                    user_id?: string
                    content?: string
                    read_at?: string | null
                    created_at?: string
                    deleted_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: 'chat_messages_chat_id_fkey'
                        columns: ['chat_id']
                        isOneToOne: false
                        referencedRelation: 'chats'
                        referencedColumns: ['id']
                    },
                    {
                        foreignKeyName: 'chat_messages_user_id_fkey'
                        columns: ['user_id']
                        isOneToOne: false
                        referencedRelation: 'users'
                        referencedColumns: ['id']
                    },
                ]
            }
            chats: {
                Row: {
                    id: string
                    match_id: string
                    created_at: string
                    deleted_at: string | null
                }
                Insert: {
                    id?: string
                    match_id: string
                    created_at?: string
                    deleted_at?: string | null
                }
                Update: {
                    id?: string
                    match_id?: string
                    created_at?: string
                    deleted_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: 'chats_match_id_fkey'
                        columns: ['match_id']
                        isOneToOne: true
                        referencedRelation: 'matches'
                        referencedColumns: ['id']
                    },
                ]
            }
            interest_categories: {
                Row: {
                    id: string
                    slug: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    slug: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    slug?: string
                    created_at?: string
                }
                Relationships: []
            }
            interests: {
                Row: {
                    id: string
                    slug: string
                    label: string
                    interest_category_id: string | null
                    created_by: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    slug: string
                    label: string
                    interest_category_id?: string | null
                    created_by?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    slug?: string
                    label?: string
                    interest_category_id?: string | null
                    created_by?: string | null
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: 'interests_interest_category_id_fkey'
                        columns: ['interest_category_id']
                        isOneToOne: false
                        referencedRelation: 'interest_categories'
                        referencedColumns: ['id']
                    },
                    {
                        foreignKeyName: 'interests_created_by_fkey'
                        columns: ['created_by']
                        isOneToOne: false
                        referencedRelation: 'users'
                        referencedColumns: ['id']
                    },
                ]
            }
            invites: {
                Row: {
                    id: string
                    space_id: string
                    token_hash: string
                    email: string | null
                    created_by: string | null
                    expires_at: string
                    used_at: string | null
                    used_by: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    space_id: string
                    token_hash: string
                    email?: string | null
                    created_by?: string | null
                    expires_at: string
                    used_at?: string | null
                    used_by?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    space_id?: string
                    token_hash?: string
                    email?: string | null
                    created_by?: string | null
                    expires_at?: string
                    used_at?: string | null
                    used_by?: string | null
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: 'invites_space_id_fkey'
                        columns: ['space_id']
                        isOneToOne: false
                        referencedRelation: 'spaces'
                        referencedColumns: ['id']
                    },
                    {
                        foreignKeyName: 'invites_created_by_fkey'
                        columns: ['created_by']
                        isOneToOne: false
                        referencedRelation: 'users'
                        referencedColumns: ['id']
                    },
                    {
                        foreignKeyName: 'invites_used_by_fkey'
                        columns: ['used_by']
                        isOneToOne: false
                        referencedRelation: 'users'
                        referencedColumns: ['id']
                    },
                ]
            }
            matches: {
                Row: {
                    id: string
                    space_id: string
                    user1_id: string
                    user2_id: string
                    user1_response: Database['public']['Enums']['match_response']
                    user2_response: Database['public']['Enums']['match_response']
                    created_at: string
                    deleted_at: string | null
                }
                Insert: {
                    id?: string
                    space_id: string
                    user1_id: string
                    user2_id: string
                    user1_response?: Database['public']['Enums']['match_response']
                    user2_response?: Database['public']['Enums']['match_response']
                    created_at?: string
                    deleted_at?: string | null
                }
                Update: {
                    id?: string
                    space_id?: string
                    user1_id?: string
                    user2_id?: string
                    user1_response?: Database['public']['Enums']['match_response']
                    user2_response?: Database['public']['Enums']['match_response']
                    created_at?: string
                    deleted_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: 'matches_space_id_fkey'
                        columns: ['space_id']
                        isOneToOne: false
                        referencedRelation: 'spaces'
                        referencedColumns: ['id']
                    },
                    {
                        foreignKeyName: 'matches_user1_id_fkey'
                        columns: ['user1_id']
                        isOneToOne: false
                        referencedRelation: 'users'
                        referencedColumns: ['id']
                    },
                    {
                        foreignKeyName: 'matches_user2_id_fkey'
                        columns: ['user2_id']
                        isOneToOne: false
                        referencedRelation: 'users'
                        referencedColumns: ['id']
                    },
                ]
            }
            spaces: {
                Row: {
                    id: string
                    slug: string
                    name: string
                    description: string | null
                    created_at: string
                    deleted_at: string | null
                }
                Insert: {
                    id?: string
                    slug: string
                    name: string
                    description?: string | null
                    created_at?: string
                    deleted_at?: string | null
                }
                Update: {
                    id?: string
                    slug?: string
                    name?: string
                    description?: string | null
                    created_at?: string
                    deleted_at?: string | null
                }
                Relationships: []
            }
            user_interests: {
                Row: {
                    user_id: string
                    interest_id: string
                    created_at: string
                }
                Insert: {
                    user_id: string
                    interest_id: string
                    created_at?: string
                }
                Update: {
                    user_id?: string
                    interest_id?: string
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: 'user_interests_user_id_fkey'
                        columns: ['user_id']
                        isOneToOne: false
                        referencedRelation: 'users'
                        referencedColumns: ['id']
                    },
                    {
                        foreignKeyName: 'user_interests_interest_id_fkey'
                        columns: ['interest_id']
                        isOneToOne: false
                        referencedRelation: 'interests'
                        referencedColumns: ['id']
                    },
                ]
            }
            users: {
                Row: {
                    id: string
                    space_id: string
                    username: string
                    bio: string | null
                    locale: string
                    created_at: string
                    last_active: string
                    deleted_at: string | null
                }
                Insert: {
                    id: string
                    space_id: string
                    username: string
                    bio?: string | null
                    locale?: string
                    created_at?: string
                    last_active?: string
                    deleted_at?: string | null
                }
                Update: {
                    id?: string
                    space_id?: string
                    username?: string
                    bio?: string | null
                    locale?: string
                    created_at?: string
                    last_active?: string
                    deleted_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: 'users_space_id_fkey'
                        columns: ['space_id']
                        isOneToOne: false
                        referencedRelation: 'spaces'
                        referencedColumns: ['id']
                    },
                ]
            }
        }
        Views: Record<string, never>
        Functions: {
            respond_to_match: {
                Args: {
                    p_match_id: string
                    p_user_id: string
                    p_response: Database['public']['Enums']['match_response']
                }
                Returns: {
                    user1_response: Database['public']['Enums']['match_response']
                    user2_response: Database['public']['Enums']['match_response']
                    chat_id: string | null
                }[]
            }
        }
        Enums: {
            match_response: 'pending' | 'accepted' | 'rejected'
        }
        CompositeTypes: Record<string, never>
    }
}

type PublicSchema = Database['public']

export type Tables<T extends keyof PublicSchema['Tables']> =
    PublicSchema['Tables'][T]['Row']
export type TablesInsert<T extends keyof PublicSchema['Tables']> =
    PublicSchema['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof PublicSchema['Tables']> =
    PublicSchema['Tables'][T]['Update']
export type Enums<T extends keyof PublicSchema['Enums']> =
    PublicSchema['Enums'][T]
