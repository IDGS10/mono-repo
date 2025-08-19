import axios from "axios";

const getToken = () => {
  const userData = JSON.parse(localStorage.getItem("monoRepoUserData"));
  return userData ? userData.token : null;
};

export const SecurityApi = axios.create({
  baseURL: "http://localhost:8010",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
  withCredentials: false,
});

export const OrganizationsApi = axios.create({
  baseURL: "http://localhost:8200/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
  withCredentials: false,
});

export const ProjectsApi = axios.create({
  baseURL: "http://localhost:3002/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
  withCredentials: false,
});

export const SwarmsApi = axios.create({
  baseURL: "http://localhost:5052",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
  withCredentials: false,
});


const setupInterceptors = (apiInstance) => {
  //Request interceptor - Add token to every request
  apiInstance.interceptors.request.use(
    (config) => {
      const token = getToken();
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  //Response interceptor - Handle authentication errors
  apiInstance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response) {
        //Avoid redirection if the route is "/api/login" or "/api/register"
        if (
          error.response.status === 401 &&
          !error.config.url.includes("/api/login") &&
          !error.config.url.includes("/api/register")
        ) {
          //If we're not on login/register routes, clear token and redirect
          localStorage.removeItem("monoRepoUserData");
          localStorage.removeItem("isLoggedIn");
          window.location.href = "/";
        }
      }
      return Promise.reject(error);
    }
  );
};

//Setup interceptors for all APIs
setupInterceptors(SecurityApi);
setupInterceptors(OrganizationsApi);
setupInterceptors(ProjectsApi);
setupInterceptors(SwarmsApi);
