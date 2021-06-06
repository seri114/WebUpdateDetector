<template>
  <div class="container">
    <div class="hello" @click.self="rowClick('')">
      <!-- Modal Edit -->
      <div
        class="modal fade"
        id="editEntry"
        tabindex="-1"
        aria-labelledby="editEntryLabel"
        aria-hidden="true"
      >
        <div class="modal-dialog modal-xl">
          <div class="modal-content">
            <div class="container">
              <div class="modal-header">
                <h5 class="modal-title" id="editEntryLabel">{{homeState.currentSetting.title}}
                </h5>
                <button
                  type="button"
                  class="btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                ></button>
              </div>
              <div class="modal-body modal-dialog-scrollable">
                <div class="container">                    
                  <div class="mb-3">
                    <label for="url">URL</label>
                    <input type="url" class="form-control validate-input" id="url" placeholder="http(s)://" required v-model="homeState.currentSetting.URL">
                  </div>
                  <div class="mb-3">
                    <label for="title">Title</label>
                    <textarea class="form-control" id="title" placeholder="タイトル" required v-model="homeState.currentSetting.title"/>
                  </div>
                  <div class="mb-3">
                    <label for="check">Check interval</label>
                    <select class="form-select" id="check" aria-label="Default select example" v-model="homeState.currentSetting.checkIntervalMinutes">
                      <option selected value="0">15min</option>
                      <option value="60">1h</option>
                      <option value="180">3h</option>
                      <option value="1440">24h</option>
                    </select>
                  </div>
                  <div class="mb-3">
                    <label for="notifyTarget">Notify telegram chatId</label>
                    <input type="text" class="form-control validate-input" id="notifyTarget" :placeholder="dbState.userSetting.notifyTarget ?? '数字10桁(複数ある場合は空白区切り)'" v-model="homeState.currentSetting.notifyTarget" pattern="([0-9]{10,10}(\s+|$))*">
                  </div>
                  <div class="mb-3">
                    <label for="selector">Selector(Advanced Setting)</label>
                    <input class="form-control validate-input" id="selector" v-model="homeState.currentSetting.selector">
                  </div>
                  <div class="mb-3">
                      <div class="form-check form-switch">
                        <label
                          class="form-check-label"
                          for="crawlEnables"
                          >Enabled</label
                        >
                        <input
                          class="form-check-input"
                          type="checkbox"
                          id="crawlEnables"
                          v-model="homeState.currentSetting.enabled"
                        />
                        <!-- <span class="align-bottom">Crawl</span> -->
                      </div>
                    </div>
                </div>

                <div class="modal-footer">
                  <button
                    type="button"
                    class="btn btn-secondary"
                    data-bs-dismiss="modal"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    class="btn btn-primary"
                    data-bs-dismiss="modal"
                    @click="setCrawlData()"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- Modal Result -->
      <div
        class="modal fade"
        id="resultEntry"
        tabindex="-1"
        aria-labelledby="editEntryLabel"
        aria-hidden="true"
      >
        <div class="modal-dialog modal-xl">
          <div class="modal-content">
            <div class="container">
              <div class="modal-header">
                <h5 class="modal-title" id="editEntryLabel">{{homeState.currentSetting.title}}
                </h5>
                <button
                  type="button"
                  class="btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                ></button>
              </div>
              <div class="modal-body modal-dialog-scrollable">
                <div class="container">                    
                  <div class="mb-3">
                    <label for="lastCheck">Last checked</label>
                    <input class="form-control" id="lastCheck" readonly :value="formatDateTime(new Date(homeState.currentSetting.lastCheck))">
                  </div>
                  <div class="mb-3">
                    <label for="lastDetectDiff">Last Diff date</label>
                    <input class="form-control" id="lastDetectDiff" readonly :value="formatDateTime(new Date(homeState.currentSetting.lastDiffTimestamp))">
                  </div>
                  <!-- <div class="mb-3">
                    <label for="lastFetchedString">prev string</label>
                    <textarea class="form-control" id="lastPrevResult" readonly :value="homeState.currentSetting.lastPrevResult" rows="10"/>
                  </div>
                  <div class="mb-3">
                    <label for="lastFetchedString">current string</label>
                    <textarea class="form-control" id="lastFetchedString" readonly :value="homeState.currentSetting.lastCheckResult" rows="10"/>
                  </div> -->
                  <div class="mb-3">
                    <label for="lastDiffHtml">Diff view</label>
                    <div class="ratio ratio-4x3">
                      <iframe v-bind:srcdoc="homeState.currentSetting.lastDiffHtml"></iframe>
                    </div>
                  </div>
                </div>

                <div class="modal-footer">
                  <button
                    type="button btn-primary"
                    class="btn btn-secondary"
                    data-bs-dismiss="modal"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <h1 v-if="authState.tryLogin">
        <font-awesome-icon icon="spinner" spin />
      </h1>
      <h1 v-else>
        Hello, {{ authState.isLoggedin ? authState.displayName : guest }}
      </h1>
      <div v-if="authState.isLoggedin">
        <input type="url" class="form-control" id="url" placeholder="http(s)://" required v-model="homeState.URL">
        <b-button v-on:click="add()" v-bind:disabled="!isAddEnabled()">
          Add
        </b-button>
        <b-button
          v-if="selected !== ''"
          v-on:click="
            () => {
              deleteCrawlData(selected);
              selected = '';
            }
          "
        >
          <font-awesome-icon v-if="selected !== ''" icon="trash" />
        </b-button>

        <div class="container">
          <table class="table">
            <thead>
              <tr>
                <th width="5%"></th>
                <th width="35%">URL</th>
                <th width="50%">Title</th>
                <th width="5%"></th>
                <th width="5%"></th>
              </tr>
            </thead>
            <tbody>
              <tr
                class="table-tr"
                v-bind:class="{ selected: selected === key }"
                v-for="(item, key) in dbState.crawlSetting"
                :key="item.id"
              >
                <td @click="rowClick(key)">
                  <font-awesome-icon v-if="selected === key" icon="check" />
                </td>
                <td
                  @click="rowClick(key)"
                  v-bind:style="rowStyle(item.enabled)"
                >
                  {{ item.hostname }}
                </td>
                <td
                  @click="rowClick(key)"
                  v-bind:style="rowStyle(item.enabled)"
                >
                  {{ item.title }}
                </td>
                <td width="5%">
                  <button
                    type="button"
                    class="btn btn-primary"
                    data-bs-toggle="modal"
                    data-bs-target="#resultEntry"
                    data-bs-key="{{key}}"
                    v-on:click="homeState.currentKey = key; homeState.currentSetting = {...dbState.crawlSetting[key]}"
                  >
                    Result
                  </button>
                </td>
                <td width="5%">
                  <button
                    type="button"
                    class="btn btn-secondary"
                    data-bs-toggle="modal"
                    data-bs-target="#editEntry"
                    data-bs-key="{{key}}"
                    v-on:click="homeState.currentKey = key; homeState.currentSetting = {...dbState.crawlSetting[key]}"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <br />
      </div>
      <div v-else-if="!authState.tryLogin">Please sign in.</div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, ref, computed, watch, watchEffect } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useDatabaseStore } from "@/stores/database";
import {getUid} from "@/stores/util"
import { v4 as uuidv4 } from "uuid";

export default defineComponent({
  name: "Home",

  setup() {
    const guest = "Guest";
    const authStore = useAuthStore();
    const authState = authStore.state;
    const dbStore = useDatabaseStore();
    const { state: dbState, isSu, watchSetting, CrawlSetting, setCrawlData: dbSetCrawlData, deleteCrawlData} = dbStore;
    const uid = () => getUid(dbStore, authStore);
    watchEffect(() =>{
      const u = uid()
      if (!u){
        return;
      }
      watchSetting(u)
    })
    const homeState = reactive({ URL: "", currentKey: undefined, currentSetting: new CrawlSetting() });
    const add = async () => {
      if (homeState.URL === "") {
        return;
      }
      const t = new CrawlSetting();
      t.URL = homeState.URL;
      t.notifyTarget = "";
      t.title = "";
      t.selector = "";
      t.enabled = true;
      dbSetCrawlData(uuidv4(), t);
      homeState.URL = "";
    };
    const setCrawlData = async () => {
      dbSetCrawlData(homeState.currentKey!, homeState.currentSetting!);
    };
    const isAddEnabled = (): boolean => {
      function isValidHttpUrl(string: string) {
        let url;

        try {
          url = new URL(string);
        } catch (_) {
          return false;
        }

        return url.protocol === "http:" || url.protocol === "https:";
      }
      return isValidHttpUrl(homeState.URL);
    };
    const formatDateTime = computed( () => (a: Date) :string =>{
      const isInvalidDate = (date: Date):boolean => Number.isNaN(date.getDate());
      if (isInvalidDate(a)){
        return ""
      }
      var formatted = `${a.getFullYear()}-${(a.getMonth()+1).toString().padStart(2, '0')}`
      +`-${a.getDate().toString().padStart(2, '0')} `
      +`${a.getHours().toString()}:${a.getMinutes()}:${a.getSeconds()}`.replace(/\n|\r/g, '');
      return formatted
    })
    const selected = ref("");
    const rowClick = (val: string) => {
      if (selected.value === val) {
        selected.value = "";
        return;
      }
      selected.value = val;
    };
    const rowStyle = computed(() => (enabled: boolean) => {
      return { color: enabled ? "black" : "gray" };
    });

    return {

      guest,

      authState,
      dbState,
      formatDateTime,
      add,
      isAddEnabled,
      homeState,
      rowClick,
      selected,
      rowStyle,
      setCrawlData,
      deleteCrawlData
    };
  }
});
</script>

<style scoped>
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
.table-tr:hover {
  background-color: #689bee; /* マウスオーバー時の行の背景色 */
}
.col-6 {
  align-self: center;
}
.value-icon {
  font-size: 40px;
  text-align-last: right;
}
.validate-input:invalid {
  border: 2px dashed red;
}
</style>
