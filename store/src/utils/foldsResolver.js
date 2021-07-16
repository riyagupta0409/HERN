import fs from 'fs'
import { get_env } from './get_env'

const axios = require('axios')

const resolveComponent = fold => {
   return new Promise(async (resolve, reject) => {
      try {
         console.log(fold)

         if (fold.moduleType === 'system-defined') {
            // component exists in our codebase
            return resolve({ id: fold.id, component: fold.name })
         }

         // else this is plugin/3rd party module

         const { path, linkedCssFiles, linkedJsFiles } =
            fold.subscriptionDivFileId

         const extension = path.split('.').pop()
         // html or js

         const content = await fs.readFileSync(
            process.cwd() + '/public/env-config.js',
            'utf-8'
         )
         const config = JSON.parse(content.replace('window._env_ = ', ''))

         // script urls
         const scripts = linkedJsFiles.map(
            ({ jsFile }) =>
               `${config['EXPRESS_URL']}/template/files${jsFile.path}`
         )

         if (extension !== 'html') {
            return resolve({ id: fold.id, scripts })
         }

         const { data } = await axios.get(
            `${config['EXPRESS_URL']}/template/files${path}`
            // `${config['EXPRESS_URL']}/template/files/default/components/faq.html`
         )

         // add css links + html
         const parsedData =
            linkedCssFiles.map(
               ({ cssFile }) =>
                  `<link rel="stylesheet" type="text/css" href="${config['EXPRESS_URL']}/template/files${cssFile.path}" media="screen"/>`
            ).join`` + data

         /*
               {
                  id: 1017,
                  scripts: ['https://test.dailykit.org/template/files/componeent/faq.js', 'https://test.dailykit.org/template/files/componeent/test.js'],
                  content: `
                     <link rel="stylesheet" type="text/css" href="https://test.dailykit.org/template/filescomponeent/faq.css" media="screen"/>
                     <h1>Hello</h1>
                  `
               }
            
            */

         if (data) {
            return resolve({
               id: fold.id,
               content: parsedData,
               scripts,
            })
         } else {
            return reject('Failed to load file')
         }
      } catch (error) {
         console.log('fetchFile', error)
         return reject(error.message)
      }
   })
}

export const foldsResolver = async folds => {
   const allFolds = Array.isArray(folds) ? folds : [folds]

   const output = await Promise.all(
      allFolds.map(fold => resolveComponent(fold))
   )

   return output
}
