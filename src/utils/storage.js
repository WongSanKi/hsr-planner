export function getUserData(user, key) {
  try {
    const userId = user?.id || 'default'
    const fullKey = `hsr_${userId}_${key}`
    const data = localStorage.getItem(fullKey)
    return data ? JSON.parse(data) : null
  } catch (e) {
    console.error('Failed to load:', e)
    return null
  }
}

export function setUserData(user, key, value) {
  try {
    const userId = user?.id || 'default'
    const fullKey = `hsr_${userId}_${key}`
    localStorage.setItem(fullKey, JSON.stringify(value))
  } catch (e) {
    console.error('Failed to save:', e)
  }
}

export function removeUserData(user, key) {
  try {
    const userId = user?.id || 'default'
    const fullKey = `hsr_${userId}_${key}`
    localStorage.removeItem(fullKey)
  } catch (e) {
    console.error('Failed to remove:', e)
  }
}