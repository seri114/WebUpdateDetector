<template>
  <!-- Modal -->
  <div
    class="modal fade"
    id="confirmedModal"
    tabindex="-1"
    aria-labelledby="confirmedModalLabel"
    aria-hidden="true"
  >
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-body">Confirmed</div>
        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-secondary"
            data-bs-dismiss="modal"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>

  <div class="container">
    <div class="view" v-if="state.isLoggedin">
      <h1>Setting</h1>
      <div class="mb-3">
        <label for="displayName">Display Name</label>
        <input
          type="text"
          class="form-control"
          id="displayName"
          v-model="displayName"
          required
        />
      </div>
      <div class="mb-3">
        <label for="notifyTarget">Default telegram chatId</label>
        <input
          type="text"
          class="form-control"
          id="notifyTarget"
          placeholder="数字6~10桁(複数ある場合は空白区切り)"
          v-model="notifyTarget"
          pattern="([0-9]{6,10}(\s+|$))*"
        />
      </div>
      <div class="mb-3" v-if="state.admin">
        <label for="su">su</label>
        <input type="text" class="form-control" id="su" v-model="su" />
      </div>
      <b-button
        v-on:click="update()"
        class="btn btn-primary"
        data-bs-toggle="modal"
        data-bs-target="#confirmedModal"
      >
        Confirm
      </b-button>
    </div>
    <div v-else-if="state.tryLogin">
      <font-awesome-icon icon="spinner" spin />
    </div>
    <div v-else>Please sign in.</div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watchEffect, watch } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useDatabaseStore } from "@/stores/database";
import { getUid } from "@/stores/util";

export default defineComponent({
  name: "Setting",
  setup() {
    console.log("setup Setting")

    const authStore = useAuthStore();
    const { state, updateUser } = authStore;
    const dbStore = useDatabaseStore();
    const { state: dbState, watchSetting, setUserData, isSu } = dbStore;
    const displayName = ref("");
    const photoURL = ref("");
    const notifyTarget = ref("");
    const su = ref("");
    const update = () => {
      updateUser({ displayName: displayName.value, photoURL: photoURL.value });
      setUserData({ notifyTarget: notifyTarget.value, su: su.value });
    };
    const uid = () => getUid(dbStore, authStore);

    const loadSetting = () => {
      console.log("loadSetting at Setting");
      displayName.value = state.displayName;
      photoURL.value = state.photoURL;

      notifyTarget.value = dbState.userSetting.notifyTarget;
      su.value = dbState.userSetting.su ?? "";
    };

    watch(dbState, (newVal, oldVal) => {
      console.log("watchEffect at Setting");
      loadSetting();
    });

    watch(uid, (newVal, oldVal) => {
      console.log("watchEffect at Setting auth");
      watchSetting(uid());
    });
    loadSetting();

    return { state, displayName, photoURL, notifyTarget, update, dbState, su };
  },
});
</script>

<style scoped>
.updater {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}
label {
  flex: 1;
}
input {
  flex: 3;
}
button {
  float: right;
}

input:invalid {
  border: 2px dashed red;
}
</style>

