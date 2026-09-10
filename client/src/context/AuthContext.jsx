import React,{createContext,useContext,useEffect,useState} from 'react'; import {api} from '../services/api';
const C=createContext();
export function AuthProvider({children}){
	const [user,setUser]=useState(()=>JSON.parse(localStorage.getItem('lc_user')||'null'));
	const [loading,setLoading]=useState(true);
	useEffect(()=>{const t=localStorage.getItem('lc_token');if(!t){setLoading(false);return;}api.get('/auth/me').then(r=>setUser(r.data.data.user)).catch(()=>{localStorage.clear();setUser(null)}).finally(()=>setLoading(false));},[]);
	const saveSession=session=>{localStorage.setItem('lc_token',session.token);localStorage.setItem('lc_user',JSON.stringify(session.user));setUser(session.user);return session.user;};
	const login=async(email,password)=>saveSession((await api.post('/auth/login',{email,password})).data.data);
	const register=async(data)=>saveSession((await api.post('/auth/register',data)).data.data);
	const hospitalPath=async()=>{try{await api.get('/hospitals/dashboard/me');return '/hospital';}catch(error){if(error.response?.status===404&&error.response?.data?.error==='NOT_FOUND')return '/hospital/setup';throw error;}};
	const logout=()=>{localStorage.clear();setUser(null);};
	return <C.Provider value={{user,loading,login,register,hospitalPath,logout}}>{children}</C.Provider>;
}
export const useAuth=()=>useContext(C);
