import fs from 'node:fs'
import path from 'node:path'

const checkFile = (filesPath, ext) => {
  for (const filePath of filesPath) {
    if (path.extname(filePath) == ext) return filePath
  }
}

const waitUntilDownloadFile = async (downloadPath, ext) => {
  console.error('Downloading...')
  await new Promise(resolve => setTimeout(resolve, 1000));

  let filesPath = await fs.readdirSync(downloadPath)

  let exist = true
  while (exist) {
    await new Promise(resolve => setTimeout(resolve, 3000))
    filesPath = await fs.readdirSync(downloadPath)
    exist = checkFile(filesPath, ext)
  }
  console.log('File Downloaded')
}

export default {
  waitUntilDownloadFile
}