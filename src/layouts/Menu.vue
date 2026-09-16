<template>
    <!-- Page Wrapper -->
    <div id="wrapper">

        <!-- Sidebar -->
        <Sidebar :mobile-open="mobileOpen" @close="closeMobile" />
        <!-- Fond assombri derrière le menu sur mobile, ferme le menu au clic -->
        <div class="obf-sidebar-backdrop" v-if="mobileOpen" @click="closeMobile"></div>
        <!-- End of Sidebar -->

        <!-- Content Wrapper -->
        <div id="content-wrapper" class="d-flex flex-column">

            <!-- Main Content -->
            <div id="content">

                <!-- Topbar -->
                <Header @toggle-menu="toggleMobile" />

                <!-- Begin Page Content -->
                <div class="container-fluid">
                    <router-view></router-view>
                </div>
                <!-- /.container-fluid -->

            </div>
            <!-- End of Main Content -->

            <!-- Footer -->
            <Footer />
            <!-- End of Footer -->

        </div>
        <!-- End of Content Wrapper -->



    </div>
    <!-- End of Page Wrapper -->


</template>

<script>
import Sidebar from './sidebar.vue'
import Header from './header.vue'
import Footer from './footer.vue'
export default {
    name: 'App',
    components: {
        Sidebar,
        Header,
        Footer
    },
    data() {
        return { mobileOpen: false }
    },
    methods: {
        toggleMobile() { this.mobileOpen = !this.mobileOpen },
        closeMobile() { this.mobileOpen = false },
    },
}
</script>

<style>
</style>
