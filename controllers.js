function Calculator($scope, $location, $timeout) {

    // коефицинети
    $scope.k = {
        penzisko: 0.184,
        zdravstveno: 0.074,
        pridones: 0.012,
        boluvanje: 0.005,
        personalen: 0.10,
        personalen_dop: 0.18,
        neto_to_bruto_oslob: 8640, // n = 0.5945 * b + 8640
        neto_to_bruto_konficent: 0.6525, // n = b - 0.275 * b  - 9000 - ( 0.725* b - 98000) * 0.18
        neto_to_bruto_konficent_18: 0.5945, // n = b - 0.275 * b  - 9000 - ( 0.725* b - 98000) * 0.18
        start_18: 90000
    }

    $scope.total_davacki_bez_personalen_koficent = $scope.k.penzisko + $scope.k.zdravstveno + $scope.k.pridones + $scope.k.boluvanje;

    $scope.danocno_osloboduvanje = 8000;
    $scope.referentna_vrednost = 36017;
    $scope.max_osnovica_za_pridonesi = $scope.referentna_vrednost * 16;
    $scope.min_osnovica_za_pridonesi = Math.round($scope.referentna_vrednost / 2);
    $scope.min_neto_plata = 12000;
    $scope.min_bruto_plata = 18008; // 50% од 36017

    var calculate = function (bruto) {
        var osnovica_za_pridonesi = bruto;

        if (bruto > $scope.max_osnovica_za_pridonesi) {
            osnovica_za_pridonesi = $scope.max_osnovica_za_pridonesi;
        } else
        if (bruto < $scope.min_osnovica_za_pridonesi) {
            osnovica_za_pridonesi = $scope.min_osnovica_za_pridonesi;
        }

        var penzisko = osnovica_za_pridonesi * $scope.k.penzisko;
        var zdravstveno = osnovica_za_pridonesi * $scope.k.zdravstveno;
        var pridones = osnovica_za_pridonesi * $scope.k.pridones;
        var boluvanje = osnovica_za_pridonesi * $scope.k.boluvanje;
        var pridonesi = penzisko + zdravstveno + pridones + boluvanje;

        $scope.penzisko = Math.round(penzisko);
        $scope.zdravstveno = Math.round(zdravstveno);
        $scope.pridones = Math.round(pridones);
        $scope.boluvanje = Math.round(boluvanje);

        $scope.bruto_minus_pridonesi = bruto - pridonesi;
        var osnovica_za_danok = $scope.bruto_minus_pridonesi - $scope.danocno_osloboduvanje;
        osnovica_za_danok = osnovica_za_danok > 0 ? osnovica_za_danok : 0;
        var personalec = osnovica_za_danok * $scope.k.personalen;
        var davacki = personalec + pridonesi;
        var neto = bruto - davacki;

        $scope.personalec = Math.round(personalec);
        $scope.osnovica_za_danok = Math.min(osnovica_za_danok, $scope.k.start_18);
        $scope.pridonesi = pridonesi;

        var personalec = Math.min(bruto - (penzisko + zdravstveno + pridones + boluvanje), $scope.k.start_18) * $scope.k.personalen;
        $scope.personalec = Math.round(personalec);
        var osnovica_za_danok_dop = neto > $scope.k.start_18 ? osnovica_za_danok - $scope.k.start_18 : 0;
        $scope.osnovica_za_danok_dop = osnovica_za_danok_dop;
        var personale_dop = Math.max((bruto - (penzisko + zdravstveno + pridones + boluvanje) - $scope.danocno_osloboduvanje - $scope.k.start_18), 0) * $scope.k.personalen_dop;
        $scope.personale_dop = Math.round(personale_dop);
        $scope.pridonesi_danok = Math.round(personalec + personale_dop + pridonesi);
        return neto;
    }

    var neto2bruto = function (neto) {
        if (neto > $scope.k.start_18) {
            var bruto = (neto - $scope.k.neto_to_bruto_oslob) / $scope.k.neto_to_bruto_konficent_18;
        } else {
            var bruto = (neto - $scope.danocno_osloboduvanje * $scope.k.personalen) / $scope.k.neto_to_bruto_konficent;
        }

        var osnovica_za_pridonesi = bruto;
        if (bruto > $scope.max_osnovica_za_pridonesi) {
            osnovica_za_pridonesi = $scope.max_osnovica_za_pridonesi;
        } else
        if (bruto < $scope.min_osnovica_za_pridonesi) {
            osnovica_za_pridonesi = $scope.min_osnovica_za_pridonesi;
        }
        return bruto;
    }

    $scope.bruto_change = function () {
        var bruto = parseFloat($scope.bruto.toString());
        $scope.neto = calculate(bruto);
        if ($scope.neto < $scope.min_neto_plata) {
            $scope.myForm.bruto.$error.min = true;
            ['penzisko', 'zdravstveno', 'pridones', 'boluvanje', 'bruto_minus_pridonesi',
                'personalec', 'personale_dop', 'osnovica_za_danok', 'osnovica_za_danok_dop', 'pridonesi', 'neto', 'pridonesi_danok'
            ].forEach(function (property) {
                delete $scope[property];
            });
            return;
        }
        $scope.myForm.bruto.$error.min = false;
    }

    $scope.neto_change = function () {
        var neto = parseFloat($scope.neto.toString()); // cheap way to clean the input
        if (neto < $scope.min_neto_plata) {
            $scope.myForm.neto.$error.min = true;
            return;
        }
        $scope.myForm.neto.$error.min = false;
        var bruto = neto2bruto(neto);
        $scope.bruto = Math.round(bruto);
        calculate(bruto);
    }
    $scope.bruto = parseFloat($location.absUrl().split('?')[1]) || undefined;
    // view is not ready yet, so delay bruto_change
    if ($scope.bruto) $timeout(function () {
        $scope.bruto_change();
    }, 1);
}