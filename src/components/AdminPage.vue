<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick, useId } from 'vue'
import * as api from '../services/adminApi.js'
import SearchBar from './SearchBar.vue'
import RestaurantForm from './RestaurantForm.vue'

const id = useId()
const checking = ref(true)
const authenticated = ref(false)
const configured = ref(true)
const username = ref('')
const password = ref('')
const loginError = ref('')
const error = ref('')
const notice = ref('')
const busy = ref(false)
const loading = ref(false)
const search = ref('')
const appliedSearch = ref('')
const borough = ref('')
const page = ref(1)
const data = ref({ items: [], total: 0, pages: 0 })
const editorOpen = ref(false)
const selected = ref(null)
const saveError = ref('')
const deleteTarget = ref(null)
const deleteError = ref('')
const deleteDialog = ref(null)
const disabled = computed(() => busy.value || loading.value)
let latestRequest = 0

function expired(cause) {
    if (cause.status !== 401) return false
    authenticated.value = false
    editorOpen.value = false
    deleteTarget.value = null
    loginError.value = 'Your session expired. Sign in again to continue.'
    return true
}

async function checkSession() {
    checking.value = true
    loginError.value = ''
    try {
        const session = await api.fetchSession()
        configured.value = session.configured
        authenticated.value = session.authenticated
        if (session.authenticated) await load()
    } catch (cause) {
        loginError.value = cause.message
    } finally {
        checking.value = false
    }
}

async function signIn() {
    busy.value = true
    loginError.value = ''
    try {
        await api.login({ username: username.value, password: password.value })
        authenticated.value = true
        await load()
    } catch (cause) {
        loginError.value = cause.message
    } finally {
        password.value = ''
        busy.value = false
    }
}

async function signOut() {
    busy.value = true
    error.value = ''
    try {
        await api.logout()
        latestRequest++
        authenticated.value = false
        editorOpen.value = false
        deleteTarget.value = null
        data.value = { items: [], total: 0, pages: 0 }
        notice.value = ''
    } catch (cause) {
        error.value = cause.message
    } finally {
        busy.value = false
    }
}

async function load() {
    if (!authenticated.value) return
    const request = ++latestRequest
    loading.value = true
    error.value = ''
    try {
        const result = await api.fetchManagedRestaurants({
            search: appliedSearch.value,
            borough: borough.value,
            page: page.value,
            limit: 15,
        })
        if (request === latestRequest) data.value = result
    } catch (cause) {
        if (request === latestRequest && !expired(cause)) error.value = cause.message
    } finally {
        if (request === latestRequest) loading.value = false
    }
}

function submitSearch() {
    appliedSearch.value = search.value
    page.value === 1 ? load() : (page.value = 1)
}
watch(page, load)
watch(borough, () => {
    page.value === 1 ? load() : (page.value = 1)
})

function edit(item = null) {
    selected.value = item
    saveError.value = ''
    editorOpen.value = false
    nextTick(() => {
        editorOpen.value = true
    })
}

async function save(payload) {
    if (!Object.keys(payload).length) {
        saveError.value = 'No changes to save.'
        return
    }
    busy.value = true
    saveError.value = ''
    notice.value = ''
    try {
        if (selected.value) await api.updateRestaurant(selected.value._id, payload)
        else await api.createRestaurant(payload)
        notice.value = selected.value ? 'Restaurant updated.' : 'Restaurant added.'
        editorOpen.value = false
        await load()
    } catch (cause) {
        if (!expired(cause)) saveError.value = cause.message
    } finally {
        busy.value = false
    }
}

watch(deleteTarget, async (item) => {
    deleteError.value = ''
    if (item) {
        await nextTick()
        deleteDialog.value?.showModal()
    }
})

async function remove() {
    busy.value = true
    deleteError.value = ''
    notice.value = ''
    try {
        await api.deleteRestaurant(deleteTarget.value._id)
        deleteTarget.value = null
        notice.value = 'Restaurant deleted.'
        if (data.value.items.length === 1 && page.value > 1) page.value--
        else await load()
    } catch (cause) {
        if (!expired(cause)) deleteError.value = cause.message
    } finally {
        busy.value = false
    }
}

onMounted(checkSession)
onBeforeUnmount(() => {
    latestRequest++
})
</script>

<template>
    <div class="min-h-screen bg-cream">
        <header class="bg-midnight text-cream">
            <div class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-6">
                <a href="#home" class="font-display text-3xl"
                    >FIND<span class="italic text-primary">ine</span></a
                >
                <div class="flex items-center gap-5 text-sm">
                    <a href="#home" class="nav-link hover:text-primary">Back to Website</a>
                    <button
                        v-if="authenticated"
                        :disabled="busy"
                        class="rounded-full border border-primary/60 px-4 py-2 hover:bg-primary/10 disabled:opacity-50"
                        @click="signOut"
                    >
                        Sign Out
                    </button>
                </div>
            </div>
        </header>
        <main class="mx-auto max-w-6xl px-6 py-12 md:py-20">
            <p class="text-xs font-bold uppercase tracking-[0.3em] text-primary-deep">Administration</p>
            <h1 class="mt-3 font-display text-4xl text-midnight md:text-5xl">Restaurant Management</h1>
            <p v-if="checking" role="status" class="mt-8 text-stone">Checking your session...</p>
            <div
                v-else-if="!authenticated"
                class="mt-8 max-w-md rounded-2xl bg-paper p-6 ring-1 ring-stone/20"
            >
                <h2 class="text-3xl text-midnight">Admin Sign In</h2>
                <p v-if="!configured" role="status" class="mt-4 text-stone">
                    Admin access is not configured yet. Contact the site owner.
                </p>
                <form v-else class="mt-6 space-y-5" :aria-busy="busy" @submit.prevent="signIn">
                    <div>
                        <label :for="`${id}-username`" class="mb-2 block text-sm font-semibold"
                            >Username</label
                        >
                        <input
                            :id="`${id}-username`"
                            v-model="username"
                            autocomplete="username"
                            required
                            maxlength="100"
                            :disabled="busy"
                            class="w-full rounded-xl border border-stone/30 bg-paper px-4 py-3"
                        />
                    </div>
                    <div>
                        <label :for="`${id}-password`" class="mb-2 block text-sm font-semibold"
                            >Password</label
                        >
                        <input
                            :id="`${id}-password`"
                            v-model="password"
                            type="password"
                            autocomplete="current-password"
                            required
                            maxlength="256"
                            :disabled="busy"
                            class="w-full rounded-xl border border-stone/30 bg-paper px-4 py-3"
                        />
                    </div>
                    <button
                        :disabled="busy"
                        class="rounded-full bg-midnight px-6 py-3 font-semibold text-cream hover:bg-primary-deep disabled:opacity-50"
                    >
                        {{ busy ? 'Signing in...' : 'Sign In' }}
                    </button>
                </form>
                <p v-if="loginError" role="alert" class="mt-4 text-sm text-midnight">{{ loginError }}</p>
                <button v-if="loginError" class="mt-3 text-sm underline" @click="checkSession">
                    Check Connection
                </button>
            </div>
            <template v-else>
                <p class="mt-4 text-stone">
                    Add restaurants, update their details and inspection records, or remove listings.
                </p>
                <div class="mt-8 flex flex-wrap items-center justify-between gap-4">
                    <button
                        :disabled="disabled"
                        class="rounded-full bg-midnight px-6 py-3 font-semibold text-cream hover:bg-primary-deep disabled:opacity-50"
                        @click="edit()"
                    >
                        Add Restaurant
                    </button>
                    <button
                        :disabled="disabled"
                        class="text-sm text-primary-deep underline disabled:opacity-50"
                        @click="load"
                    >
                        Refresh List
                    </button>
                </div>
                <p role="status" class="mt-4 text-sm text-primary-deep">{{ notice }}</p>
                <RestaurantForm
                    v-if="editorOpen"
                    :item="selected"
                    :busy="busy"
                    :error="saveError"
                    @save="save"
                    @cancel="editorOpen = false"
                />
                <div class="mt-10 flex flex-wrap items-end gap-4">
                    <SearchBar
                        v-model="search"
                        placeholder="Search by Name or Cuisine"
                        @submit="submitSearch"
                    />
                    <div>
                        <label :for="`${id}-borough`" class="mb-2 block text-sm">Filter by Borough</label>
                        <select
                            :id="`${id}-borough`"
                            v-model="borough"
                            :disabled="disabled"
                            class="rounded-xl border border-stone/30 bg-paper px-4 py-3"
                        >
                            <option value="">All Boroughs</option>
                            <option
                                v-for="place in ['Bronx', 'Brooklyn', 'Manhattan', 'Queens', 'Staten Island']"
                                :key="place"
                            >
                                {{ place }}
                            </option>
                        </select>
                    </div>
                </div>
                <p v-if="error" role="alert" class="mt-6 text-midnight">
                    {{ error }} <button class="underline" :disabled="busy" @click="load">Retry</button>
                </p>
                <div class="mt-6" :aria-busy="loading">
                    <p role="status" class="mb-4 text-sm text-stone">
                        {{
                            loading
                                ? 'Loading restaurants...'
                                : `${data.total.toLocaleString()} Restaurants Found`
                        }}
                    </p>
                    <div
                        class="overflow-x-auto rounded-2xl bg-paper ring-1 ring-stone/20"
                        :class="{ 'opacity-50': loading }"
                    >
                        <table class="w-full min-w-[760px] text-left text-sm">
                            <caption class="sr-only">
                                Restaurant Records and Management Actions
                            </caption>
                            <thead class="bg-midnight text-cream">
                                <tr>
                                    <th class="p-4">Restaurant</th>
                                    <th class="p-4">Borough</th>
                                    <th class="p-4">Cuisine</th>
                                    <th class="p-4">Inspections</th>
                                    <th class="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr
                                    v-for="item in data.items"
                                    :key="item._id"
                                    class="border-t border-stone/15 hover:bg-primary/10"
                                >
                                    <td class="p-4">
                                        <span class="block font-semibold text-midnight">{{ item.name }}</span
                                        ><span class="mt-1 block text-xs text-stone"
                                            >{{ item.address?.building }} {{ item.address?.street }}</span
                                        >
                                    </td>
                                    <td class="p-4">{{ item.borough }}</td>
                                    <td class="p-4">{{ item.cuisine }}</td>
                                    <td class="p-4">{{ item.grades?.length || 0 }}</td>
                                    <td class="p-4 text-right">
                                        <div class="flex justify-end gap-3">
                                            <button
                                                :disabled="disabled"
                                                class="rounded-full border border-stone/30 px-4 py-2 hover:border-primary-deep disabled:opacity-50"
                                                :aria-label="`Edit ${item.name}`"
                                                @click="edit(item)"
                                            >
                                                Edit</button
                                            ><button
                                                :disabled="disabled"
                                                class="rounded-full border border-stone/30 px-4 py-2 hover:border-primary-deep disabled:opacity-50"
                                                :aria-label="`Delete ${item.name}`"
                                                @click="deleteTarget = item"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                <tr v-if="!data.items.length">
                                    <td colspan="5" class="p-10 text-center text-stone">
                                        {{ loading ? 'Loading...' : 'No restaurants match your search.' }}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                <div v-if="data.pages > 1" class="mt-6 flex items-center justify-center gap-4 text-sm">
                    <button
                        :disabled="disabled || page <= 1"
                        class="rounded-full border border-stone/30 px-4 py-2 disabled:opacity-40"
                        @click="page--"
                    >
                        Previous
                    </button>
                    <span>Page {{ page }} of {{ data.pages }}</span>
                    <button
                        :disabled="disabled || page >= data.pages"
                        class="rounded-full border border-stone/30 px-4 py-2 disabled:opacity-40"
                        @click="page++"
                    >
                        Next
                    </button>
                </div>
            </template>
        </main>
        <dialog
            v-if="deleteTarget"
            ref="deleteDialog"
            :aria-labelledby="`${id}-delete-title`"
            class="m-auto w-[calc(100%_-_3rem)] max-w-md rounded-2xl bg-paper p-6 text-ink shadow-xl backdrop:bg-midnight/60"
            @cancel="!busy && (deleteTarget = null)"
            @keydown.esc="busy && $event.preventDefault()"
        >
            <h2 :id="`${id}-delete-title`" class="text-3xl text-midnight">Delete restaurant?</h2>
            <p class="mt-4">
                Permanently delete <strong>{{ deleteTarget.name }}</strong> and its inspection records? This
                cannot be undone.
            </p>
            <p v-if="deleteError" role="alert" class="mt-4 text-sm">{{ deleteError }}</p>
            <div class="mt-6 flex flex-wrap gap-3">
                <button
                    :disabled="busy"
                    class="rounded-full border border-stone/30 px-5 py-2 disabled:opacity-50"
                    autofocus
                    @click="deleteTarget = null"
                >
                    Cancel
                </button>
                <button
                    :disabled="busy"
                    class="rounded-full bg-midnight px-5 py-2 text-cream hover:bg-primary-deep disabled:opacity-50"
                    @click="remove"
                >
                    {{ busy ? 'Deleting...' : 'Delete Restaurant' }}
                </button>
            </div>
        </dialog>
    </div>
</template>
