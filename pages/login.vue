<template>
  <div class="max-w-md mx-auto">
    <h1 class="text-3xl font-bold mb-8 text-center">Login</h1>
    
    <form @submit.prevent="handleLogin" class="space-y-6">
      <div>
        <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
        <input
          id="email"
          v-model="email"
          type="email"
          required
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>
      
      <div>
        <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
        <input
          id="password"
          v-model="password"
          type="password"
          required
          minlength="6"
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
        <p class="mt-1 text-sm text-gray-500">Password must be at least 6 characters long</p>
      </div>
      
      <div v-if="error" class="text-red-600 text-sm">
        {{ error }}
      </div>
      
      <button
        type="submit"
        :disabled="!isValidPassword"
        class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {{ isSignUp ? 'Sign Up' : 'Login' }}
      </button>
    </form>
    
    <div class="mt-6">
      <p class="text-center text-sm text-gray-600">
        {{ isSignUp ? 'Already have an account?' : "Don't have an account?" }}
        <button @click="toggleMode" class="text-blue-600 hover:text-blue-500">
          {{ isSignUp ? 'Login' : 'Sign up' }}
        </button>
      </p>
    </div>
  </div>
</template>

<script setup>
const client = useSupabaseClient()
const email = ref('')
const password = ref('')
const error = ref(null)
const isSignUp = ref(false)

const isValidPassword = computed(() => password.value.length >= 6)

const toggleMode = () => {
  isSignUp.value = !isSignUp.value
  error.value = null
}

const handleLogin = async () => {
  if (!isValidPassword.value) {
    error.value = 'Password must be at least 6 characters long'
    return
  }

  try {
    error.value = null
    const { error: authError } = isSignUp.value
      ? await client.auth.signUp({
          email: email.value,
          password: password.value,
          options: {
            emailRedirectTo: `${window.location.origin}/confirm`
          }
        })
      : await client.auth.signInWithPassword({
          email: email.value,
          password: password.value
        })
    
    if (authError) throw authError
    
    navigateTo(isSignUp.value ? '/profile' : '/')
  } catch (e) {
    error.value = e.message
  }
}
</script>