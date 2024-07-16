import axios from "axios"

export const api = axios.create({
  baseURL: "http://10.00.0.206:3333"
})
