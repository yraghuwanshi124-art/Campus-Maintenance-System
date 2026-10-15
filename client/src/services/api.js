

// import axios from "axios";

// const api = axios.create({
//   baseURL: "https://campus-maintainace-system-vhie.vercel.app/api",
// });

// export default api;

// import axios from "axios";

// const api = axios.create({
//   baseURL: "http://localhost:5000/api",
// });

// export default api;



// import axios from "axios";

// const api = axios.create({
//   // baseURL: "http://localhost:5000/api",
//   // baseURL: "https://campus-maintainace-system-vhie.vercel.app/api",
//   baseURL: "https://campus-maintainace-system.onrender.com",
// });

// // Attach JWT token to every protected request
// api.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem("token");

//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }

//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// export default api;



// import axios from "axios";

// const api = axios.create({
//   baseURL: "http://localhost:5000/api",
//   baseURL: "https://campus-maintainace-system-1.onrender.com/api",

// });

// // Attach JWT token to every protected request
// api.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem("token");

//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }

//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// export default api;



import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  // baseURL: import.meta.env.VITE_API_URL,
});

// Attach JWT token to every protected request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
