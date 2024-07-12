import axios from "axios"

export const api = axios.create({
  baseURL: "http://10.00.0.205:3333"
})
