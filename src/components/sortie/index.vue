<template>
  <div class="container-fluid p-3">
    <PageHeader title="Décaissement" subtitle="Sorties de trésorerie" crumb="Trésorerie">
      <template #actions>
        <b-button variant="outline-primary" @click="fetchclients">
          <i class="fas fa-sync-alt mr-1"></i> Rafraîchir
        </b-button>
        <b-button variant="primary" @click="openModalFacture">
          <i class="fas fa-plus mr-1"></i> Saisir un décaissement
        </b-button>
      </template>
    </PageHeader>
    <div class="card shadow mb-4">
      <div class="card-header py-3">
        Decaissement
      </div>
      <div class="card-body">
        <template v-if="loader === false">
          <div class="text-center">
            <b-spinner style="width: 3rem; height: 3rem;" label="Large Spinner"></b-spinner>
            <b-spinner style="width: 3rem; height: 3rem;" label="Large Spinner" type="grow"></b-spinner>
          </div>
        </template>
        <template v-else>
          <b-col md="3" align="right">
            <b-form-input type="search" id="filterInput" v-model="filter" placeholder="Rechercher....."></b-form-input>
          </b-col>
          <br>
          <b-table
              head-variant="light"
              bordered
              hover
              responsive="xl"
              :items="listes"
              :fields="fields"
              :filter="filter"
              :current-page="currentPage"
              :per-page="perPage"
          >
            <template v-slot:cell(actions)="row">
              <b-button
                  size="sm"
                  variant="outline-primary"
                  class="mr-1"
                  @click="modifier(row.item)"
              >
                modifier
              </b-button>
            </template>
            <template v-slot:cell(justif)="row">
              <span type="button" class="text-info" @click="openModalJustif(row.item.code_sortie)" v-if="row.item.justif"><i class="fas fa-fw fa-folder"></i></span>
            </template>
            <template v-slot:cell(montant_sortie_caisse)="row">
              <span class="text-right font-weight-bold">{{new Intl.NumberFormat().format(row.item.montant_sortie_caisse)}} FCFA</span>
            </template>
            <template v-slot:custom-foot="data">
              <b-tr>
                <b-td colspan="5" class="text-uppercase text-right text-danger font-weight-bold">TOTAL DECAISSEMENT</b-td>
                <b-td colspan="2" class="text-uppercase text-left text-danger font-weight-bold">{{new Intl.NumberFormat().format(totalListes)}} FCFA</b-td>
              </b-tr>
              <b-tr>
                <b-td colspan="5" class="text-uppercase text-right text-danger font-weight-bold">TOTAL ENCAISSEMENT</b-td>
                <b-td colspan="2" class="text-uppercase text-left text-danger font-weight-bold">{{new Intl.NumberFormat().format(totalEncaissement)}} FCFA</b-td>
              </b-tr>
              <b-tr>
                <b-td colspan="5" class="text-uppercase text-right text-danger font-weight-bold">TOTAL approvisionnement </b-td>
                <b-td colspan="2" class="text-uppercase text-left text-danger font-weight-bold">{{new Intl.NumberFormat().format(totalAppro)}} FCFA</b-td>
              </b-tr>
              <b-tr>
                <b-td colspan="5" class="text-uppercase text-right text-danger font-weight-bold">DIFFERENCE</b-td>
                <b-td colspan="2" class="text-uppercase text-left text-danger font-weight-bold">{{new Intl.NumberFormat().format(restant)}} FCFA</b-td>
              </b-tr>
            </template>
          </b-table>
          <b-pagination
              :total-rows="totalRows"
              :per-page="perPage"
              v-model="currentPage"
              class="my-0 pagination-sm"
          />
        </template>
      </div>

    </div>

    <b-modal ref="mymodal" hide-footer no-close-on-backdrop title="Justificatif">
      <div class="d-block text-center">
        <b-table-simple  bordered
                         hover
                         responsive="xl" >
          <b-thead>
            <b-tr>
              <b-th>Element</b-th>
              <b-th>Action</b-th>
            </b-tr>
          </b-thead>
          <b-tbody>
            <b-tr v-for="item in elements" :key="item.code_sortie">
              <b-td>{{item.justif}}</b-td>
              <b-td class="text-center"><b-button variant="success" @click="dowloadFile(item.id_justif)">Télécharger</b-button></b-td>
            </b-tr>
          </b-tbody>
        </b-table-simple>
      </div>
      <b-button class="mt-3" variant="danger" block @click="hideModal">Fermer</b-button>
    </b-modal>
    <Facture ref="modalFacture"></Facture>
  </div>
</template>

<script>
const axios = require('axios')
import API_BASE_URL from "@/api/config.js";
import Facture from "@/components/sortie/facture";
import PageHeader from "@/components/ui/PageHeader.vue";
export default {
  name: "index",
  data(){
    return {
      filter :"",
      elements:[],
      currentPage: 1,
      loader : false,
      perPage: 20,
      listes:[],
      totalListes:0,
      totalEncaissement:0,
      totalAppro:0,
      restant : 0,
      totalRows: null,
      fields:[
        { key: 'code_sortie',
          label: 'Code',
          sortable: true
        },
        { key: 'date_sortie',
          label: 'Date',
          sortable: true
        },
        { key: 'libelle_sortie_caisse',
          label: 'Libelle / Source',
          sortable: true
        },
        { key: 'observation',
          sortable: true
        },
        { key: 'justif',
          label: 'Justification',
          class: 'text-center',
          sortable: true
        },
        { key: 'montant_sortie_caisse',
          label: 'Montant',
          class: 'text-right',
          sortable: true
        },
        { key: 'actions',
          sortable: true
        },

      ],

    }
  },
  components: {
   Facture,
   PageHeader
  },
  created() {
    this.fetchclients()
    //localStorage.removeItem('matricule')
    Fire.$on('creationok',()=>{
      this.fetchclients();
    })

  },
  methods: {
    hideModal() {
      this.$refs['mymodal'].hide()
    },
    async modifier(dataPat) {
      this.$refs.modalFacture.selectedTA = dataPat
      this.$refs.modalFacture.editMode = true
      this.$refs.modalFacture.showModalFacture()
    },
    async dowloadFile(id){
      let api = `${API_BASE_URL}/api/dowload_sortie/${id}`
      axios({
        url: api,
        method: 'GET',
        responseType: 'blob',
      }).then((response) => {
        var fileURL = window.URL.createObjectURL(new Blob([response.data]));
        var fileLink = document.createElement('a');
        fileLink.href = fileURL;
        fileLink.setAttribute('download', 'file.pdf');
        document.body.appendChild(fileLink);

        fileLink.click();
      });
    },
    async fetchclients(){
      this.loader = false
      let api = `${API_BASE_URL}/api/listes_sortie`
      await axios.get(api).then(response=>{
        let statut = response.status
        if (statut === 200){
          this.listes = response.data.listes
          this.totalListes = Math.round(response.data.total)
          this.totalEncaissement = Math.round(response.data.encaisse)
          this.totalAppro = Math.round(response.data.appro)
          this.restant = Math.round((this.totalEncaissement + this.totalAppro) - this.totalListes)
          this.totalRows = this.listes.length
          console.log(this.totalRows)
        }
      }).catch((err) => {
        console.log(err)
      })
      this.loader = true
    },

    openModalJustif(id){
      let api = `${API_BASE_URL}/api/listes_justif_sortie/${id}`
       axios.get(api).then(response=>{
        let statut = response.status
        if (statut === 201){
          this.elements = response.data
          this.$refs['mymodal'].show()
        }
      }).catch((err) => {
        console.log(err)
      })

    },
    openModalFacture() {
      this.$refs.modalFacture.editMode = false
      this.$refs.modalFacture.showModalFacture()
    },


  },

}
</script>

<style scoped>

</style>
