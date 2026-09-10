import axios from 'axios';
export const API_URL=import.meta.env.VITE_API_URL||'http://localhost:5000/api'; export const SOCKET_URL=import.meta.env.VITE_SOCKET_URL||API_URL.replace(/\/api$/,'');
export const api=axios.create({baseURL:API_URL}); api.interceptors.request.use(c=>{const token=localStorage.getItem('lc_token');if(token)c.headers.Authorization=`Bearer ${token}`;return c;}); api.interceptors.response.use(r=>r,r=>{if(r.response?.status===401){localStorage.removeItem('lc_token');localStorage.removeItem('lc_user');window.location.href='/login';}return Promise.reject(r);});
