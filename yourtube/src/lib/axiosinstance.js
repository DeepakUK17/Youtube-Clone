import axios from "axios";
const axiosInstance = axios.create({
  baseURL: "/", // Use relative path to hit Next.js rewrites proxy
});
export default axiosInstance;
