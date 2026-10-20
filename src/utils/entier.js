// Directive v-entier : un champ de montant (FCFA) n'accepte que des nombres entiers.
// Pas de virgule, de point, de signe ni de notation scientifique : ces touches sont bloquées,
// et une valeur décimale collée est tronquée. À poser sur un <b-form-input type="number"> ou un <input>.
//
//   <b-form-input type="number" min="0" v-entier v-model="montant"></b-form-input>
//
// Les quantités en kg ne l'utilisent pas : elles restent décimales.
const TOUCHES_BLOQUEES = ['.', ',', 'e', 'E', '+', '-']

export default {
  bind (el) {
    const input = el.tagName === 'INPUT' ? el : el.querySelector('input')
    if (!input) return

    input.setAttribute('step', '1')
    input.setAttribute('inputmode', 'numeric')

    input.addEventListener('keydown', (e) => {
      if (TOUCHES_BLOQUEES.includes(e.key)) e.preventDefault()
    })

    input.addEventListener('input', () => {
      if (/[.,]/.test(input.value)) {
        input.value = input.value.split(/[.,]/)[0]
        input.dispatchEvent(new Event('input', { bubbles: true }))
      }
    })
  },
}
