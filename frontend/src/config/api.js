import axios from 'axios';

export const API_CONFIG = {
  BASE_SERVER: import.meta.env.VITE_API_BASE_SERVER || 'http://localhost:8200',
  
  BASE_API: import.meta.env.VITE_API_BASE || 'http://localhost:8200/api',
};


export const API_BASE = API_CONFIG.BASE_API || "http://localhost:8200/api";
export const SERVER_BASE = API_CONFIG.BASE_SERVER || "http://localhost:8200";

