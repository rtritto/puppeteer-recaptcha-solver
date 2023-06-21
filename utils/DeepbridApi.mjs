import { FormData } from 'undici'

import requestApi from './requestApi.mjs'

const DL_LINK = 'https://www.deepbrid.com/backend-dl/index.php'

/**
 * @param {Object} proxy 
 * @param {String} proxy.host 
 * @param {Number} proxy.port 
 * @param {String} link 
 */
const getDLWithProxy = async (proxy, link) => {
  // console.log('Call with LINK', link)

  const formData = new FormData()
  formData.set('link', link)
  formData.set('pass', '')

  const data = await requestApi.proxyRequest(proxy, DL_LINK, {
    method: 'POST',
    body: formData,
    query: {
      page: 'api',
      action: 'generateLink'
    }
  }).then((res) => res.body.json())

  // console.log('DATA', data)

  const { link: linkDL } = data

  if (linkDL && linkDL.constructor.name == 'String') {
    console.log('\x1b[32m', 'LINK DL', '\x1b[0m', linkDL)
    return linkDL
  } else {
    console.error('Error getDLWithProxy data', data)
    throw data
  }
}

export default {
  getDLWithProxy
}