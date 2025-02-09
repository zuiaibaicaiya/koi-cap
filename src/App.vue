<script setup lang="ts">
import KoiCap from "@/KoiCap.vue";
import {ElConfigProvider} from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
</script>

<template>
  <el-config-provider :locale="zhCn">
    <koi-cap/>
  </el-config-provider>
</template>

<style scoped>

</style>
