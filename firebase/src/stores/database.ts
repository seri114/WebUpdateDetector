import { BAlert } from "bootstrap-vue";
import firebase from "firebase/app";
import {getDatabase, serverTimestamp, DataSnapshot, ref, set, remove, off, onValue, query, orderByChild} from 'firebase/database';
import { inject, InjectionKey, reactive, readonly, watch, ref as vRef} from "vue";

const databaseStore = () => {
  console.log('init databaseStore')
  class CrawlSetting {
    URL: string;
    hostname: string;
    notifyTarget: string;
    title: string;
    selector: string;
    created: Record<string, unknown>;
    enabled: boolean;
    lastCheck: Record<string, unknown>;
    lastCheckResult: string;
    lastPrevResult: string;
    lastDiffTimestamp: Record<string, unknown>;
    lastDiffHtml: string;
    checkIntervalMinutes: number;
    constructor() {
      this.URL = ""
      this.hostname = ""
      this.notifyTarget = ""
      this.title = ""
      this.selector = ""
      this.created = {}
      this.enabled = true
      this.lastCheck = {}
      this.lastCheckResult = ""
      this.lastPrevResult = ""
      this.lastDiffTimestamp = {}
      this.lastDiffHtml = ""
      this.checkIntervalMinutes = 0
    }
  }
  class UserSetting {
    notifyTarget: string;
    su: string | null;
    constructor() {
      this.notifyTarget = ""
      this.su = null
    }
  }

  class CrawlSettingDictionary {
    [id: string]: CrawlSetting;
  }
  const state = reactive(
    {
      crawlSetting: new CrawlSettingDictionary(),
      userSetting: new UserSetting(),
      refPath: ""
    }
  );
  const isSu = vRef(false)
  const fetchCrawlSetting = (snap: DataSnapshot) => {
    state.crawlSetting = new CrawlSettingDictionary()
    snap.forEach((data) => {
      const val = data.val()
      const value: CrawlSetting = {
        title: val.title,
        URL: val.URL,
        hostname: val.URL !== "" ? new URL(val.URL).hostname : "",
        selector: val.selector,
        notifyTarget: val.notifyTarget,
        created: val.created,
        enabled: val.enabled === undefined ? "true" : val.enabled,
        lastCheck: val.lastCheck ?? {},
        lastCheckResult: val.lastCheckResult ?? "",
        lastPrevResult: val.lastPrevResult ?? "",
        lastDiffTimestamp: val.lastDiffTimestamp ?? {},
        lastDiffHtml: val.lastDiffHtml ?? "",
        checkIntervalMinutes: val.checkIntervalMinutes ?? 0
      }
      state.crawlSetting[data.key!] = value
    })
  }
  const fetchUserSetting = (snap: DataSnapshot) => {
    console.log("fetchUserSetting" + JSON.stringify(snap.val()))
    const val = snap.val()
    if (!val){
      return;
    }
    state.userSetting.notifyTarget = val.notifyTarget || ""
    state.userSetting.su = val.su
    console.log("done" + JSON.stringify(snap.val()))
  }
  const genDataRootPath = (id: string) => {
    return `crawler/${id}`
  }
  const crawlSettingPath = () => {
    return `${state.refPath}/crawlSetting`
  }
  const setCrawlData = async (key: string, value: CrawlSetting) => {
    console.log("setData")
    const newData = { ...value, created: value.created ?? serverTimestamp() }
    const db = getDatabase()
    console.log(crawlSettingPath())
    const refSetting = ref(db, (`${crawlSettingPath()}/${key}`))
    set(refSetting, newData)
  }
  const deleteCrawlData = (key: string) => {
    if (key === ""){
      return;
    }
    const db = getDatabase()
    remove(ref(db, `${crawlSettingPath()}/${key}`))
  }
  const userSettingPath = () => {
    return `${state.refPath}/userSetting`
  }
  const setUserData = (value: UserSetting) => {
    // console.log("setData")
    const db = getDatabase()
    console.log(`setUserData${crawlSettingPath()} value${JSON.stringify(value)}`)
    const refSetting = ref(db, userSettingPath())
    set(refSetting, value)
  }
  const watchSetting = (id: string) => {
    if ( !id) {
      return;
    }
    const newRefPath = genDataRootPath(id)
    if (state.refPath === newRefPath) {
      return;
    }
    console.log(`watchSetting at database ${id}`)
    if (state.refPath !== "") {
      console.log(`off ${state.refPath}`)
      off(ref(getDatabase(), state.refPath))
    }
    state.crawlSetting = new CrawlSettingDictionary()
    state.refPath = newRefPath;
    // console.log(`onValue ${crawlSettingPath()} ${userSettingPath()}`)
    onValue(query(ref(getDatabase(), crawlSettingPath()), orderByChild('created')), (snap) => fetchCrawlSetting(snap));
    onValue(ref(getDatabase(), userSettingPath()), (snap) => fetchUserSetting(snap));
  }
  const setSu = (s: boolean) => {
    isSu.value = s
  }

  return {
    state: readonly(state),
    CrawlSetting,
    setCrawlData,
    UserSetting,
    setUserData,
    watchSetting,
    deleteCrawlData,
    setSu,
    isSu
  };
}

export default databaseStore

export type DatabaseStore = ReturnType<typeof databaseStore>;

export const databaseStoreKey: InjectionKey<DatabaseStore> = Symbol('databaseStore');

export const useDatabaseStore = ():DatabaseStore => {
  const store = inject(databaseStoreKey);
  if (!store) {
    throw new Error(`${databaseStoreKey} is not provided`);
  }
  return store;
}