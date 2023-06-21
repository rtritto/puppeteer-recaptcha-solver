import { request, ProxyAgent } from 'undici'

// let axiosInstance = null

// const getAxios = () => {
//   if (!axiosInstance) {
//     axiosInstance = axios.create({})//({
//     //baseURL: 'https://some-domain.com/api/',
//     //timeout: 1000,
//     //headers: {'X-Custom-Header': 'foobar'}
//     //})
//   }

//   return axiosInstance
// }

// /**
//  * @param {import('puppeteer').HTTPRequest} request 
//  * @param {Object} proxy 
//  * @param {String} proxy.host 
//  * @param {Number} proxy.port 
//  */
// const addHttpProxy = async (request, { host, port }) => {
//   /**
//    * @param {import('axios').AxiosResponse} response
//    */
//   const {
//     data: body,
//     headers,
//     status
//     // .request
//   } = await axios({
//     url: request.url(),
//     proxy: {
//       //protocol: 'http',
//       host,
//       port
//     },
//     data: request.postData(),
//     headers: request.headers(),
//     method: request.method(),
//     // Disable auto JSON.parse
//     transformResponse: res => res,
//     // Disable status code validation
//     validateStatus: () => true
//   })

//   await request.respond({
//     body,
//     headers,
//     status
//   })
// }

/**
 * 
 * @param {{host: string, port: number}} proxy 
 * @param {string} url 
 * @param {object} options
 * @returns 
 */
const proxyRequest = ({ host, port }, url, options = {}) => {
  const proxyAgent = new ProxyAgent({ uri: `http://${host}:${port}` })

  return request(url, {
    // bodyTimeout: 60,
    // withCredentials: true,  axios
    dispatcher: proxyAgent,
    ...options
  })
}

export default {
  // addHttpProxy,
  proxyRequest
}