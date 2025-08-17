<template>
    <div class="max-w-2xl mx-auto">
        <div class="flex justify-between items-center mb-8">
            <h1 class="text-3xl font-bold">Your Profile</h1>
            <div class="flex items-center gap-2">
                <i class="pi pi-building text-gray-500"></i>
                <span class="text-gray-600">
                    {{ currentSpace ? currentSpace.name : 'No Space Selected' }}
                </span>
            </div>
        </div>

        <!-- Space Context Warning -->
        <Message 
            v-if="!currentSpace" 
            severity="warn" 
            class="mb-6"
        >
            <template #messageicon>
                <i class="pi pi-exclamation-triangle"></i>
            </template>
            No space is currently selected. Please select a space from the navbar to view and edit your profile for that context.
        </Message>

        <form @submit.prevent="saveUser" class="p-fluid" :disabled="!currentSpace">
            <div v-if="userLoading || !user" class="mb-4">
                <Skeleton height="40px" class="mb-2" />
                <Skeleton height="40px" />
            </div>
            <template v-else>
                <div class="field mb-4">
                    <label for="username" class="font-medium">Username</label>
                    <InputText
                        :pt="{
                            root: {
                                class: 'text-black rounded',
                            },
                        }"
                        id="username"
                        v-model="user.username"
                        required
                        class="w-full"
                    />
                </div>
                <div class="field mb-4">
                    <label for="bio" class="font-medium">Bio</label>
                    <InputText
                        :pt="{
                            root: {
                                class: 'text-black rounded',
                            },
                        }"
                        id="bio"
                        v-model="user.bio"
                        class="w-full"
                    />
                </div>
            </template>
            <div class="field mb-4">
                <label class="font-medium block mb-2">Interests</label>
                <div class="flex flex-wrap gap-2">
                    <Skeleton
                        v-if="isLoading"
                        v-for="i in 5"
                        :key="i"
                        height="40px"
                        width="77px"
                        borderRadius="16px"
                    />
                    <Chip
                        v-else
                        v-for="interest in interests"
                        :key="interest.id"
                        :label="$t(interest.slug)"
                        :class="
                            selectedInterests.includes(interest.id)
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-black'
                        "
                        class="cursor-pointer"
                        @click="toggleInterest(interest)"
                    >
                        <template
                            v-if="selectedInterests.includes(interest.id)"
                            #icon
                        >
                            <svg
                                width="14"
                                height="14"
                                viewBox="0 0 14 14"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                class="p-icon p-chip-remove-icon"
                                aria-hidden="true"
                                data-pc-section="removeicon"
                            >
                                <path
                                    fill-rule="evenodd"
                                    clip-rule="evenodd"
                                    d="M7 14C5.61553 14 4.26215 13.5895 3.11101 12.8203C1.95987 12.0511 1.06266 10.9579 0.532846 9.67879C0.00303296 8.3997 -0.13559 6.99224 0.134506 5.63437C0.404603 4.2765 1.07129 3.02922 2.05026 2.05026C3.02922 1.07129 4.2765 0.404603 5.63437 0.134506C6.99224 -0.13559 8.3997 0.00303296 9.67879 0.532846C10.9579 1.06266 12.0511 1.95987 12.8203 3.11101C13.5895 4.26215 14 5.61553 14 7C14 8.85652 13.2625 10.637 11.9497 11.9497C10.637 13.2625 8.85652 14 7 14ZM7 1.16667C5.84628 1.16667 4.71846 1.50879 3.75918 2.14976C2.79989 2.79074 2.05222 3.70178 1.61071 4.76768C1.16919 5.83358 1.05367 7.00647 1.27876 8.13803C1.50384 9.26958 2.05941 10.309 2.87521 11.1248C3.69102 11.9406 4.73042 12.4962 5.86198 12.7212C6.99353 12.9463 8.16642 12.8308 9.23232 12.3893C10.2982 11.9478 11.2093 11.2001 11.8502 10.2408C12.4912 9.28154 12.8333 8.15373 12.8333 7C12.8333 5.45291 12.2188 3.96918 11.1248 2.87521C10.0308 1.78125 8.5471 1.16667 7 1.16667ZM4.66662 9.91668C4.58998 9.91704 4.51404 9.90209 4.44325 9.87271C4.37246 9.84333 4.30826 9.8001 4.2544 9.74557C4.14516 9.6362 4.0838 9.48793 4.0838 9.33335C4.0838 9.17876 4.14516 9.0305 4.2544 8.92113L6.17553 7L4.25443 5.07891C4.15139 4.96832 4.09529 4.82207 4.09796 4.67094C4.10063 4.51982 4.16185 4.37563 4.26872 4.26876C4.3756 4.16188 4.51979 4.10066 4.67091 4.09799C4.82204 4.09532 4.96829 4.15142 5.07887 4.25446L6.99997 6.17556L8.92106 4.25446C9.03164 4.15142 9.1779 4.09532 9.32903 4.09799C9.48015 4.10066 9.62434 4.16188 9.73121 4.26876C9.83809 4.37563 9.89931 4.51982 9.90198 4.67094C9.90464 4.82207 9.84855 4.96832 9.74551 5.07891L7.82441 7L9.74554 8.92113C9.85478 9.0305 9.91614 9.17876 9.91614 9.33335C9.91614 9.48793 9.85478 9.6362 9.74554 9.74557C9.69168 9.8001 9.62748 9.84333 9.55669 9.87271C9.4859 9.90209 9.40996 9.91704 9.33332 9.91668C9.25668 9.91704 9.18073 9.90209 9.10995 9.87271C9.03916 9.84333 8.97495 9.8001 8.9211 9.74557L6.99997 7.82444L5.07884 9.74557C5.02499 9.8001 4.96078 9.84333 4.88999 9.87271C4.81921 9.90209 4.74326 9.91704 4.66662 9.91668Z"
                                    fill="currentColor"
                                ></path>
                            </svg>
                        </template>
                    </Chip>
                </div>
            </div>

            <Message v-if="error" severity="error" :text="error" class="mb-4" />
            {{ error }}
            <div class="flex gap-4">
                <Button
                    type="submit"
                    label="Save Profile"
                    class="flex-1"
                    :disabled="loading || userLoading || !currentSpace"
                />
                <Button
                    type="button"
                    label="Create New Space"
                    icon="pi pi-plus"
                    severity="secondary"
                    @click="showCreateSpaceDialog = true"
                />
            </div>
        </form>

        <!-- Create Space Dialog -->
        <Dialog 
            v-model:visible="showCreateSpaceDialog" 
            modal 
            header="Create New Space" 
            :style="{ width: '450px' }"
        >
            <form @submit.prevent="createNewSpace" class="p-fluid">
                <div class="field mb-4">
                    <label for="spaceName" class="font-medium">Space Name</label>
                    <InputText
                        id="spaceName"
                        v-model="newSpaceData.name"
                        required
                        placeholder="Enter space name"
                        class="w-full"
                    />
                </div>
                <div class="field mb-4">
                    <label for="spaceDescription" class="font-medium">Description (Optional)</label>
                    <Textarea
                        id="spaceDescription"
                        v-model="newSpaceData.description"
                        placeholder="Enter space description"
                        rows="3"
                        class="w-full"
                    />
                </div>
                <div class="flex justify-end gap-2">
                    <Button
                        type="button"
                        label="Cancel"
                        severity="secondary"
                        @click="showCreateSpaceDialog = false"
                    />
                    <Button
                        type="submit"
                        label="Create Space"
                        :loading="spaceLoading"
                    />
                </div>
            </form>
        </Dialog>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import Dialog from 'primevue/dialog'
import Textarea from 'primevue/textarea'
import Message from 'primevue/message'

const router = useRouter()
const {
    user,
    isLoading: userLoading,
    error: userError,
    fetchUser,
    updateUser,
} = useUser()

const {
    interests,
    isLoading,
    error: interestsError,
    fetchAllInterests,
    fetchUserInterests,
    replaceUserInterests,
    getUserInterests,
} = useInterests()

const {
    currentSpace,
    currentSpaceId,
    createSpace,
    isLoading: spaceLoading,
} = useSpaceContext()

const loading = ref(true)
const error = ref(null)
const selectedInterests = ref([])
const showCreateSpaceDialog = ref(false)
const newSpaceData = reactive({
    name: '',
    description: '',
})

// Initialize with any interests from the user data
onMounted(async () => {
    try {
        // Ensure interests and user are loaded
        await Promise.all([fetchAllInterests(), fetchUser()])

        // If user interests were passed in the user object, use them
        if (user.value?.interests?.length) {
            selectedInterests.value = user.value.interests.map(
                (interest) => interest.id,
            )
        }
        // Otherwise fetch them using the composable
        else if (user.value?.id) {
            const userInterests = await fetchUserInterests(user.value.id)
            selectedInterests.value = userInterests.map(
                (interest) => interest.id,
            )
        }
    } catch (err) {
        error.value = err.message || 'Failed to load interests'
    } finally {
        loading.value = false
    }
})

const toggleInterest = (interest) => {
    const index = selectedInterests.value.indexOf(interest.id)
    if (index === -1) {
        selectedInterests.value.push(interest.id)
    } else {
        selectedInterests.value.splice(index, 1)
    }
}

const createNewSpace = async () => {
    try {
        await createSpace({
            name: newSpaceData.name,
            description: newSpaceData.description,
        })
        
        // Reset form and close dialog
        newSpaceData.name = ''
        newSpaceData.description = ''
        showCreateSpaceDialog.value = false
    } catch (err) {
        error.value = err.message || 'Failed to create space'
    }
}

const loadProfileForCurrentSpace = async () => {
    if (!currentSpaceId.value || !user.value?.id) return
    
    try {
        // Load user interests for the current space context
        const userInterests = await fetchUserInterests(user.value.id, currentSpaceId.value)
        selectedInterests.value = userInterests.map(interest => interest.id)
    } catch (err) {
        console.error('Failed to load profile for space:', err)
    }
}

const saveUser = async () => {
    try {
        error.value = null
        loading.value = true

        if (!currentSpaceId.value) {
            throw new Error('No space selected')
        }

        // Update user using the new updateUser method from the composable
        await updateUser({
            id: user.value.id,
            username: user.value.username,
            bio: user.value.bio,
        })

        // Update user interests for the current space context
        const success = await replaceUserInterests(
            user.value.id,
            selectedInterests.value,
            currentSpaceId.value,
        )

        if (!success) {
            if (interestsError.value) {
                throw interestsError.value
            } else {
                throw new Error('Failed to update interests')
            }
        }

        // Navigate back to home page after successful save
        router.push('/')
    } catch (e) {
        error.value = e.message || 'An error occurred while saving'
    } finally {
        loading.value = false
    }
}

// Watch for space changes and reload profile data
watch(currentSpaceId, async (newSpaceId) => {
    if (newSpaceId) {
        await loadProfileForCurrentSpace()
    }
}, { immediate: true })
</script>
