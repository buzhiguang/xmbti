<template>
  <span class="in" title="在line上分享">
    <a target="_blank" :href="web_url"><img src="/img/team35.png"></a>
  </span>
</template>

<script>
export default {
  name: "in_share_btn",
  data() {
    return {
      share: "",
      web_url: ""
    };
  },
  props: ["share_path"],
  mounted() {
    this.web_url =
      "http://line.me/R/msg/text/?" +
      window.location.host;
  }
};
</script>

<style scoped lang="less">
@media screen and(max-width: 414px) {
  .in{
    margin-left: 5px !important;
  }
}
.in {
  position: relative;
  display: inline-block;
  max-width: 38px;
  max-height: 38px;
  width: 100%;
  border-radius: 3px;
  line-height: 40px;
  text-align: center;
  margin-left: 15px;
  vertical-align: middle;
  a {
    color: white;
    text-decoration: none;
    img {
      width: 100%;
    }
  }
}
</style>
