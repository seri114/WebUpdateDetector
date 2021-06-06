import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import { Telegraf } from 'telegraf'
import { FetchPage } from './fetch-page'
import * as diff from './diff-text'
import * as odiff from 'odiff-bin'
import * as fs from 'fs'

admin.initializeApp()

const runtimeOpts = {
  memory: '1GB' as const,
  timeoutSeconds: 300
}

const dummyMode = process.env.FUNCTIONS_EMULATOR === 'true'
console.log({ dummyMode })

const adminTeregramNotifyTargert = functions.config().telegram.adminnotifytarget
const teregramNotifyTargertsText = functions.config().telegram.defaultnotifytargets


async function sendMessageToTelegram (to: string, text: string): Promise<string> {
  const bot = new Telegraf(functions.config().telegram.token)
  console.log('send to: ' + to)
  if (dummyMode) {
    console.log(text)
    return text
  } else {
    const sent = await bot.telegram.sendMessage(to, text, { parse_mode: 'HTML' })
    return sent.text
  }
}

async function sendEmergencyMessage (s: string) {
  await sendMessageToTelegram(adminTeregramNotifyTargert, s)
}

async function executeCrawlFunction () {
  const db = admin.database()
  const refResult = db.ref('crawl/result')
  const refSetting = db.ref('crawl/setting')
  const snap = await refResult.orderByChild('lastCheck').once('value')
  const arr: any[] = []
  snap.forEach((data) => {
    arr.push(data)
  })

  const fetchPage = new FetchPage()

  const crawlFunc = async (data: any) => {
    const resultVal = data.val()
    const interval = resultVal.interval
    const lastCheckResult = resultVal.lastCheckResult || ''
    const settingID = data.key!
    const refSnap = await refSetting.once('value')
    const settingVal = refSnap.val()[settingID]
    const URL = settingVal.URL
    // const lastCheck = resultVal.lastCheck
    // console.log('lastCheck:' + lastCheck + ' settingUUID:' + settingID + ' URL:' + URL)
    const notifyTarget = settingVal.notifyTarget
    const selector = settingVal.selector
    const title = settingVal.title || 'URL'
    const [resultTmp, cap1] = (await fetchPage.fetch(URL, selector))
    const result = resultTmp.slice(0, 10000)
    const bucket = admin.storage().bucket('crested-bloom-273314.appspot.com')
    const capFile = bucket.file(`crawlResult/${settingID}/capture.png`)
    const [capFileIsExists] = await capFile.exists()
    try {
      await admin.database()
        .ref('crawl/result/' + settingID)
        .set(
          {
            lastCheck: admin.database.ServerValue.TIMESTAMP,
            interval: interval,
            lastCheckResult: result
          }
        )
      if (!capFileIsExists) {
        await capFile.save(cap1)
      }
      if (!!lastCheckResult && !diff.checkTextNearlyEqual(lastCheckResult, result)) {
        if (notifyTarget) {
          const notifyTargetList = notifyTarget.split(' ')
          const output = diff.createDiffHTML(title, URL, lastCheckResult, result)
          await Promise.all(notifyTargetList.map(async (t: string) => {
            await sendMessageToTelegram(t, output.innerHTML)
          }))
        }
        await capFile.download({ destination: `/tmp/${settingID}_before.png`, validation: false })
        // gs capture.png -> gs capture_before.png
        await bucket.upload(`/tmp/${settingID}_before.png`, { destination: `crawlResult/${settingID}/capture_before.png` })
        // gs capture.pngに保存
        await capFile.save(cap1)

        // local に保存
        const fs2 = fs.promises
        fs2.writeFile(`/tmp/${settingID}_after.png`, cap1)
        const diffResult = await odiff.compare(`/tmp/${settingID}_before.png`, `/tmp/${settingID}_after.png`, `/tmp/${settingID}_diff.png`, { threshold: 0.9, antialiasing: true })
        console.log({ diffResult })

        await bucket.upload(`/tmp/${settingID}_diff.png`, { destination: `crawlResult/${settingID}/capture_diff.png` })
      }
    } catch (e:any){
      console.error(e.message)
    }
  }
  let failCounter = 5
  try {
    for (const item of arr) {
      if (failCounter === 0) {
        const msg = 'fail counter exceeded.'
        await sendEmergencyMessage(msg)
        return
      }
      try {
        await crawlFunc(item)
      } catch (e) {
        failCounter--
      }
    }
  } finally {
    console.log('finished crawl')
    fetchPage.close()
  }
}

async function executeCrawlFunction2 () {
  
  const db = admin.database()
  const snap = await db.ref('crawler').once('value')
  const arr: any[] = []
  snap.forEach((data) => {
    arr.push(data)
  })

  let checkCounter = 0

  const fetchPage = new FetchPage()

  const crawlFunc = async (data: any) => {
    const userId = data.key!
    const snapCrawlSetting = await db.ref(`crawler/${userId}/crawlSetting`).once('value')
    const arr: any[] = []


    const user = await admin.auth().getUser(userId);
    const checkOk = user?.customClaims?.user === true;
    if (!checkOk){
      console.log(`uid ${userId} is not valid user`)
      return;
    }

    snapCrawlSetting.forEach((data) => {
      arr.push(data)
    })
    const crawlFunc2 = async (setting:any) =>{
      const settingId = setting.key!
      const settingVal = setting.val()
      const URL = settingVal.URL
      const lastCheckResult = settingVal.lastCheckResult || ''
      
      const selector = settingVal.selector || null
      const enabled: boolean = settingVal.enabled === undefined ? true : settingVal.enabled
      const checkIntervalMinutes:number = settingVal.checkIntervalMinutes || 0
      const lastCheck: number = settingVal.lastCheck || 0
      if (!enabled){
        return
      }
      const margin = 5
      const interval = (Date.now() - lastCheck)/1000/60
      if ( interval < checkIntervalMinutes - margin){
        console.log(`skip ${URL}, interval:${interval} checkInterval:${checkIntervalMinutes} margin:${margin}`)
        return
      }
      let notifyTarget = settingVal.notifyTarget
      if (!notifyTarget){
        const val = (await admin.database()
        .ref(`crawler/${userId}/userSetting`).once('value')).val()
        notifyTarget = val ? val.notifyTarget : null
      }
      checkCounter++
      if ( checkCounter >= 30 ) {
        if (checkCounter == 0){
          console.log("check counter exceeded")
        }
        return
      }
      const title = settingVal.title
      const [resultTmp, cap1] = (await fetchPage.fetch(URL, selector))
      const result = resultTmp.slice(0, 10000)
      const bucket = admin.storage().bucket('crested-bloom-273314.appspot.com')
      if (!fs.existsSync(`/tmp/${userId}`)){
        fs.mkdirSync(`/tmp/${userId}`);
      }
      const capFile = bucket.file(`crawlResult/${userId}/${settingId}/capture.png`)
      const [capFileIsExists] = await capFile.exists()
      try{

        if (!capFileIsExists) {
          await capFile.save(cap1)
        }
        let lastDiffTimestamp: any = null
        let lastDiffHtml: any = null
        if (!!lastCheckResult && !diff.checkTextNearlyEqual(lastCheckResult, result)) {
          lastDiffTimestamp = admin.database.ServerValue.TIMESTAMP
          const output = diff.createDiffHTML(title, URL, lastCheckResult, result)
          lastDiffHtml = output.innerHTML
          if (notifyTarget) {
            const notifyTargetList = notifyTarget.split(' ')
            await Promise.all(notifyTargetList.map(async (t: string) => {
              await sendMessageToTelegram(t, output.innerHTML)
            }))
          }
          await capFile.download({ destination: `/tmp/${userId}/${settingId}_before.png`, validation: false })
          // gs capture.png -> gs capture_before.png
          await bucket.upload(`/tmp/${userId}/${settingId}_before.png`, { destination: `crawlResult/${userId}/${settingId}/capture_before.png` })
          // gs capture.pngに保存
          await capFile.save(cap1)

          // local に保存
          const fs2 = fs.promises
          fs2.writeFile(`/tmp/${userId}/${settingId}_after.png`, cap1)
          const diffResult = await odiff.compare(`/tmp/${userId}/${settingId}_before.png`, `/tmp/${userId}/${settingId}_after.png`, `/tmp/${userId}/${settingId}_diff.png`, { threshold: 0.9, antialiasing: true })
          console.log({ diffResult })
          if (!diffResult.match){
            await bucket.upload(`/tmp/${userId}/${settingId}_diff.png`, { destination: `crawlResult/${userId}/${settingId}/capture_diff.png` })
          }
        }
        const crawlResult = {
          lastCheck: admin.database.ServerValue.TIMESTAMP,
          lastCheckResult: result
        }
        await admin.database()
          .ref(`crawler/${userId}/crawlSetting/${settingId}`)
          .update(lastDiffTimestamp ? {...crawlResult, lastDiffTimestamp, lastDiffHtml, lastPrevResult:lastCheckResult}: crawlResult)

      } catch (e:any){
        console.error(e.message)
      }
    }

    for(const setting of arr) await crawlFunc2(setting);
  }
  let failCounter = 5
  try {
    for (const item of arr) {
      if (failCounter === 0) {
        const msg = 'fail counter exceeded.'
        await sendEmergencyMessage(msg)
        return
      }
      try {
        await crawlFunc(item)
      } catch (e) {
        failCounter--
      }
    }
  } finally {
    console.log('finished crawl')
    fetchPage.close()
  }
}


export const crawlPubSub = functions.runWith(runtimeOpts).pubsub.topic('executeCrawl').onPublish(async (message) => {
  await executeCrawlFunction()
  await executeCrawlFunction2()
})

export const executeCrawl = functions.runWith(runtimeOpts).https.onRequest(async (req, res) => {
  console.log(req.body)
  await executeCrawlFunction()
  res.send('check finished')
})
export const executeCrawl2 = functions.runWith(runtimeOpts).https.onRequest(async (req, res) => {
  console.log(req.body)
  await executeCrawlFunction2()
  res.send('check2 finished')
})

export const updateTitle = functions.runWith(runtimeOpts).database.ref('/crawler/{uid}/crawlSetting/{uuid}/URL')
    .onCreate(async (snapshot: any, context: any) => {
      // Grab the current value of what was written to the Realtime Database.
      const URL = snapshot.val();
      const fetchPage = new FetchPage()
      const title = (await fetchPage.fetchTitle(URL))
      const db = admin.database()
      console.log(`/crawler/${context.params.uid}/crawlSetting/${context.params.uuid}/title`)
      db.ref(`/crawler/${context.params.uid}/crawlSetting/${context.params.uuid}/title`).once('value').then((s) => {
        if (s.exists()){
          return snapshot.ref.parent.child('title').set(title);  
        }
      })
    });
