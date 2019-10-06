var Vue = require('vue')
var axios = require('axios')
var toastr = require('./toastr')

// Set up header
axios.defaults.headers.common['token'] = ['YOU_API_KEY_HERE']

new Vue({
    el: '#app',
    data: {
        counties: null,
        selectedCountyName: '',
        cities: null,
        showCities: false,
        selectedCityId: null,
        showCityOptions: false,
    },
    mounted() {

        /**
         * Get the initial data to start the page, inform user if something wrong happened
         */
        axios.get('https://probafeladat-api.zengo.eu/api/all_states')
        .then(response => {

            let responseData = response.data
            
            switch (responseData.success) {

                case false:
                    alert(responseData.errorMessage.name)
                    break

                case true:

                    this.counties = response.data.data
                    break

                default:
                    break
            }
        })
        .catch(error => {
            console.log(error)
        })

    },
    methods: {

        /**
         * Post the selected county id after validation then handle the response
         *
         * @param {*} event
         *
         */
        selectCounty: function (event) {

            let stateId = event.target.value
            this.selectedCountyName = ''

            if (isNaN(stateId)) {
                alert("A kiválasztott érték nem megfelelő!")
                return
            }

            axios({
                method: 'POST',
                url: 'https://probafeladat-api.zengo.eu/api/state_city',
                data: {
                    'state_id': stateId
                },
                config: {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            })
            .then(response => {
                let responseData = response.data

                switch (responseData.success) {

                    case false:
                        alert(responseData.errorMessage.name)
                        break

                    case true:

                        this.showCities = true
                        this.cities = responseData.data

                        for(var i = 0 in this.counties) {
                            if(this.counties[i].id == stateId) {
                                this.selectedCountyName = this.counties[i].name
                                break
                            }
                        }

                        document.getElementsByClassName('county-selector')[0].classList.add('opened')
                        this.closeCityOptions()
                        break

                    default:
                        break
                }
            })
            .catch(error => {
                console.log(error)
            })
        },

        /**
         * Select the city by id and show the available options
         *
         * @param {int} id
         */
        selectCity: function(id) {
            if(isNaN(id)) {
                alert("A kiválasztott érték nem megfelelő!")
                return
            }

            this.showCityOptions = true
            this.selectedCityId = id
        },

        /**
         * Sets the city options view back to deafult and deselects city
         */
        closeCityOptions: function() {
            this.showCityOptions = false
            this.selectedCityId = null
        },

        /**
         * Puts a new city into the selected county
         *
         * @param {*} event
         */
        addNewCity: function(event) {
            let newCityName = event.target.elements.new_city_name.value
            let selectedCountyId = document.getElementsByName('selected_county')[0].value

            if(newCityName == null || newCityName == '') {
                alert('Új város neve nem lehet üres!')
                return
            }

            axios({
                method: 'PUT',
                url: 'https://probafeladat-api.zengo.eu/api/city',
                data: {
                    'name': newCityName,
                    'state_id': selectedCountyId
                },
                config: {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            })
            .then(response => {

                let responseData = response.data

                switch (responseData.success) {

                    case false:
                        alert(responseData.errorMessage.name)
                        break

                    case true:

                        toastr.success('Új város sikeresen hozzáadva.', 'Siker!')

                        // Add city to the list
                        this.cities.push({
                            'id': responseData.data.id,
                            'name': responseData.data.name,
                        })

                        // reset view
                        this.closeCityOptions()
                        document.getElementsByName('new_city_name')[0].value = null
                        break

                    default:
                        break
                }
            })
            .catch(error => {
                console.log(error)
            })
        },

        /**
         * Posts the modified name if the selected city.
         *
         * @param {int} id
         * @param {string} name
         */
        modifyCity: function(id, oldName) {

            let newName = document.getElementsByName('edit_city_name')[0].value

            // if the new name is the same as the old one do nothing and reset the view
            if(newName == oldName) {
                this.closeCityOptions()
                return
            }

            axios({
                method: 'PATCH',
                url: 'https://probafeladat-api.zengo.eu/api/city',
                data: {
                    'name': newName,
                    'city_id': id
                },
                config: {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            })
            .then(response => {

                let responseData = response.data

                switch (responseData.success) {

                    case false:
                        alert(responseData.errorMessage.name)
                        break

                    case true:

                        toastr.success('Város sikeresen szerkesztve.', 'Siker!')

                        // modify city name locally
                        this.cities.forEach(function (city) {
                            if (city.id == id) {
                                city.name = newName
                                return
                            }
                        })

                        this.closeCityOptions()
                        break

                    default:
                        break

                }
            })
            .catch(error => {
                console.log(error)
            })
        },

        /**
         * Deletes the given city by id
         *
         * @param {int} id
         */
        deleteCity: function(id) {

            if(isNaN(id)) {
                alert('A megadott érték nem megfelelő!')
                return
            }

            axios({
                method: 'DELETE',
                url: 'https://probafeladat-api.zengo.eu/api/city',
                data: {
                    'city_id': id
                },
                config: {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            })
            .then(response => {

                let responseData = response.data

                switch (responseData.success) {

                    case false:
                        alert(responseData.errorMessage.name)
                        break

                    case true:

                        toastr.success('Város sikeresen eltávolítva.', 'Siker!')

                        // remove the city from the local list
                        for(var i = 0 in this.cities) {
                            if (this.cities[i].id == id) {
                                this.cities.splice(i, 1);
                                break
                            }
                        }

                        this.closeCityOptions()
                        break

                    default:
                        break

                }
            })
            .catch(error => {
                console.log(error)
            })

        }
    }
})
