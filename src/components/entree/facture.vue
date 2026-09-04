<template>
  <b-modal ref="my-modal-facture" size="lg" :hide-footer="true" :title="title">
    <form @submit.prevent="save">
      <div class="row">
        <div class="col-md-6">
          <b-form-group
              label="Code">
            <b-form-input readonly v-model="code_entre"></b-form-input>
          </b-form-group>
        </div>
        <div class="col-md-6">
          <b-form-group
              label="Libelle approvisionnement">
            <b-form-input v-model="formData.libelle"></b-form-input>
          </b-form-group>
        </div>
      </div>
      <div class="row">
        <div class="col-md-6">
          <b-form-group
              label="Date Entrée">
            <b-form-datepicker
                placeholder="selectionner une date"
                locale="fr-FR"
                v-model="formData.date_facture"
            >
            </b-form-datepicker>
          </b-form-group>
        </div>
        <div class="col-md-6">
          <b-form-group
              label="Montant">
            <b-form-input type="number" v-model="formData.montant"></b-form-input>
          </b-form-group>
        </div>
      </div>
      <div class="row">
        <div class="col-md-6">
          <b-form-group
              label="Justificatif">
            <b-form-file
                id="upload-file"
                multiple
                accept=".pdf"
                v-model="formData.justification"
                @change="fieldChange"
            ></b-form-file>

          </b-form-group>
        </div>
        <div class="col-md-6">
          <b-form-group
              label="Observation">
            <b-form-textarea
                id="textarea"
                v-model="formData.observation"
                rows="3"
                max-rows="6"
            ></b-form-textarea>

          </b-form-group>
        </div>
      </div>
      <div class="row justify-content-end">
        <b-button variant="primary mr-1" type="submit" :disabled="isSubmitting" v-if="this.formData.libelle.length > 0">enregistrer</b-button>
        <b-button variant="danger mr-1" @click="closeModalFacture">fermer</b-button>
      </div>
    </form>
  </b-modal>
</template>

<script>
import API_BASE_URL from '@/api/config.js'
import axios from "axios";
import moment from "moment";
export default {
  props: {
    selectedTA: {},
    editMode: Boolean
  },
  name: "facture",
  data() {
    return {
      apidata : `${API_BASE_URL}/api/facture`,
      selected : null,
      code_entre:'',
      isSubmitting:false,
      title:"Mise à jour entrée de caisse",
      attachments:[],
      form: new FormData,
      formData: {
        libelle: "",
        date_facture:moment().format('YYYY-MM-DD'),
        montant:0,
        observation:'',
        justification:null
      }
    }
  },
  methods: {
    fieldChange(e){
      let selectedFiles=e.target.files;
      if(!selectedFiles.length){
        return false;
      }
      for(let i=0;i<selectedFiles.length;i++){
        this.attachments.push(selectedFiles[i]);
      }
      console.log(this.attachments);
    },
    showModalFacture() {
      if (this.editMode === true) {
        this.code_entre = this.selectedTA.code_entre
        this.formData.libelle = this.selectedTA.libelle_entre_caisse
        this.formData.date_facture = this.selectedTA.date_entre_caisse
        this.formData.montant = this.selectedTA.montant_entre_caisse
        this.formData.observation = this.selectedTA.observation
        this.$refs['my-modal-facture'].show()
      }else{
        this.reset()
        var dateobj = new Date();
        var dateObject = dateobj.getFullYear();
        let api = `${API_BASE_URL}/api/code`
        axios.get(api).then(response=>{
          let statut = response.status
          if (statut === 201){
            this.code_entre = response.data
            this.formData.libelle = ''
            this.formData.date_facture = moment().format('YYYY-MM-DD')
            this.formData.montant = 0
            this.formData.observation = ''
            this.attachments = []
            this.$refs['my-modal-facture'].show()
          }
        }).catch((err) => {
          console.log(err)
        })

      }

    },
    closeModalFacture() {
      this.reset()
      this.$refs['my-modal-facture'].hide()
    },
    generateCode(){
      var suffixe = Math.floor((1 + Math.random()) * 0x10000)
          .toString(16)
          .substring(1);
      var facture = 'FACTGCOBF'+suffixe
      return facture.toUpperCase()
    },
    async enregistrer(){},
    async save(){
      if (this.isSubmitting) return
      this.isSubmitting = true
      var data_facture
      if (this.editMode === false){
        data_facture = {
          code:this.code_entre,
          libelle: this.formData.libelle,
          date_entre : this.formData.date_facture,
          observation : this.formData.observation,
          montant : this.formData.montant,
          type:1,
        }

        if (this.formData.justification != null){
          this.form.append('code',this.code_entre)
          for(let i=0; i<this.attachments.length;i++){
            this.form.append('pics[]',this.attachments[i]);
          }
          const config = { headers: { 'Content-Type': 'multipart/form-data' } };
          document.getElementById('upload-file').value=[];
          axios.post(`${API_BASE_URL}/api/upload`,this.form,config).then(response=>{
            console.log(response);
          }).catch(response=>{
            console.log(response);
          });
        }

        await this.$http.post(`${API_BASE_URL}/api/entre/facture`,data_facture).then(response=>{
          Fire.$emit('creationok');
          this.reset();
          this.closeModalFacture()
        }).catch((err) => {
          console.log(err)
        })


      }else{

        data_facture = {
          code:this.code_entre,
          libelle: this.formData.libelle,
          date_entre : this.formData.date_facture,
          observation : this.formData.observation,
          montant : this.formData.montant,
          type:2,
        }

        if (this.formData.justification != null){
          this.form.append('code',this.code_entre)
          this.form.append('update',2)
          for(let i=0; i<this.attachments.length;i++){
            this.form.append('pics[]',this.attachments[i]);
          }
          const config = { headers: { 'Content-Type': 'multipart/form-data' } };
          document.getElementById('upload-file').value=[];
          axios.post(`${API_BASE_URL}/api/upload`,this.form,config).then(response=>{
            console.log(response);
          }).catch(response=>{
            console.log(response);
          });
        }

        await this.$http.post(`${API_BASE_URL}/api/entre/facture`,data_facture).then(response=>{
          Fire.$emit('creationok');
          this.reset();
          this.closeModalFacture()
        }).catch((err) => {
          console.log(err)
        })

      }



      this.isSubmitting = false
    },
    reset(){
      this.formData.libelle = ''
      this.formData.date_facture = moment().format('YYYY-MM-DD')
      this.formData.observation = ''
      this.formData.montant = 0
      this.formData.justification = null
      this.attachments = []
    },
  },


}
</script>

<style scoped>

</style>