<template>
  <div class="view" v-if="state.isLoggedin">
    <h1>Setting</h1>
    <div class="updater">
      <label>Display Name</label>
      <input type="text" v-model="displayName" />
    </div>
    <div class="updater">
      <label>telegraph id</label>
      <input type="text" v-model="notifyTarget" />
    </div>
    <button @click="update()">Update</button>
  </div>
  <div v-else>Please sign in.</div>
</template>

<script lang="ts">
import { defineComponent, ref, watchEffect } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useDatabaseStore } from "@/stores/database";

export default defineComponent({
  name: "Setting",
  setup() {
    const { state, updateUser } = useAuthStore();
    const { state: dbState, watchSetting, setUserData } = useDatabaseStore();
    const displayName = ref("");
    const photoURL = ref("");
    const notifyTarget = ref("");
    const update = () =>{
      updateUser({ displayName: displayName.value, photoURL: photoURL.value });
      setUserData( {...dbState.userSetting, notifyTarget: notifyTarget.value})
    }

    watchEffect(() => {
      console.log("watchEffect at Loading")
      displayName.value = state.displayName;
      photoURL.value = state.photoURL;
      notifyTarget.value = dbState.userSetting.notifyTarget;
      watchSetting(state.uid)
    });

    return { state, displayName, photoURL, notifyTarget, update };
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
</style>

