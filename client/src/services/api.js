import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

export const testBackend = async () => {
  const response = await api.get("/");
  return response.data;
};

export default api;