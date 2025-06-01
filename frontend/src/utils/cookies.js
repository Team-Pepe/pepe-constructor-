export const getCookie = (name) => {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
};

export const getAuthToken = () => {
  // Primero intentar obtener de cookies
  const cookieToken = getCookie('token');
  console.log('🍪 Token en cookies:', cookieToken ? 'ENCONTRADO' : 'NO ENCONTRADO');
  
  if (cookieToken) {
    console.log('✅ Usando token de cookies');
    return cookieToken;
  }
  
  // Si no está en cookies, intentar localStorage
  const storageToken = localStorage.getItem('authToken');
  console.log('💾 Token en localStorage:', storageToken ? 'ENCONTRADO' : 'NO ENCONTRADO');
  
  if (storageToken) {
    console.log('✅ Usando token de localStorage');
    return storageToken;
  }
  
  console.log('❌ No se encontró token en ningún lado');
  console.log('🔍 Cookies disponibles:', document.cookie);
  console.log('🔍 localStorage keys:', Object.keys(localStorage));
  
  return null;
}; 