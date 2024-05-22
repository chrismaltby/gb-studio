import type RendererAPI from "./setup";

type WindowWithAPI = {
  API: typeof RendererAPI;
};

const API = (window as unknown as WindowWithAPI).API;

export default API;
