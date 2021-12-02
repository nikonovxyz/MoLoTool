/**
 * Created by HOME on 04.02.2017.
 */
var motifLibrary = (function () {
    var _fileName = "motifLibrary",
        _eventHandler = function() {},
        _displayedFeatures = null,

        _library = {},
        _featuresForTableLibrary = {}, //created to speed up requests when building table

        _logoBaseUrl = "https://hocomoco11.autosome.ru";


    var create = function (eventHandler) {
        _displayedFeatures = {
            "direct_logo_url": "Logo",
            "uniprot_id": "Uniprot ID",
            "motif_families": "Family",
            "motif_subfamilies": "Subfamily",
            "gene_names": "Gene name"
        };

        _library = {};

        setEventHandlerTo(eventHandler);
    };


    var setEventHandlerTo = function (eventHandler) {
        _eventHandler = eventHandler;
    };


    var handleEvent = function () {
        _eventHandler();
    };


    var addUnit = function (motifName) {
        if (inLibrary(motifName)) {
            handleEvent();
            errorHandler.logError({"fileName": _fileName, "message": "motif already in the library"});
        } else {
            _library[motifName] = {status: "promised"};

            promiseMotif(motifName).then( motif => {
                    motif.status = "resolved";

                    _library[motif["full_name"]] = motif;
                    _featuresForTableLibrary[motif["full_name"]] = extractDisplayedFeatures(motif);

                    handleEvent();
                    console.log(motif['full_name'] + " motif added \n\n");
                    console.log(extractDisplayedFeatures(motif));
                });
        }
    };


    var inLibrary = function (motifName) {
        return ("undefined" !== typeof(_library[motifName]));
    };


    var promiseMotif = function(motifName) {
        return new Promise(function (resolve) {
            var XHR = ("onload" in new XMLHttpRequest()) ? XMLHttpRequest : XDomainRequest;
            var xhr = new XHR();
            var motifSource = "https://hocomoco11.autosome.ru/motif/" + motifName + ".json?with_matrices=true&with_thresholds=true";

            xhr.open('GET', motifSource, true);
            xhr.send();

            xhr.onload = function() {
                resolve( JSON.parse(this.responseText) );
            }

            xhr.onerror = function() {
                errorHandler.logError({"fileName": _fileName, "message": "motif data is not loaded"});
            }

        });
    }


    var extractDisplayedFeatures = function (motif) {
        if (_displayedFeatures === null) {
            errorHandler.logError({"fileName": _fileName, "message": "motifLibrary must be created _displayedFeatures = null"});
            return {};
        } else {
            var valuesToDisplay = {}, displayedFeature,
                logoFullUrl, uniprotFullUrl, geneFullUrl;

            for (var jsonFeature in _displayedFeatures) {
                displayedFeature = _displayedFeatures[jsonFeature];

                if (displayedFeature === "Logo") {
                    logoFullUrl = _logoBaseUrl + motif[jsonFeature];
                    valuesToDisplay[displayedFeature] =
                        '<a class="material-icons md-dark interface-button logo-button" ' +
                        'onclick="motifTable.invertModel(this)" title="Click to invert model">sync</a>' +
                        `<img class="direct" src="${logoFullUrl}"/>` +
                        `<img class="inverted hidden" src="${logoFullUrl.replace('direct', 'revcomp')}"/>`;
                }

                else if (displayedFeature === "Uniprot ID") {
                    uniprotFullUrl = "https://www.uniprot.org/uniprot/" + motif[jsonFeature];
                    valuesToDisplay[displayedFeature] = "<a href=\"" + uniprotFullUrl + "\"" +
                        " class=\"hocomoco-info\" target=\"_blank\">" +
                        motif[jsonFeature] + "</a>";
                }

                else if (displayedFeature === "Gene name") {
                    if (motif["full_name"].match(/HUMAN/) !== null) {
                        geneFullUrl = "https://www.genenames.org/cgi-bin/gene_symbol_report?match=" + motif[jsonFeature];
                        valuesToDisplay[displayedFeature] = "<a href=\"" + geneFullUrl + "\"" +
                            " class=\"hocomoco-info\" target=\"_blank\">" +
                            motif[jsonFeature] + "</a>";
                    }

                    else if (motif["full_name"].match(/MOUSE/) !== null) {
                        geneFullUrl = "https://www.informatics.jax.org/searchtool/Search.do?query=" + motif[jsonFeature];
                        valuesToDisplay[displayedFeature] = "<a href=\"" + geneFullUrl + "\"" +
                            " class=\"hocomoco-info\" target=\"_blank\">" +
                            motif[jsonFeature] + "</a>";
                    }

                    else {
                        valuesToDisplay[displayedFeature] = motif[jsonFeature];
                    }
                }

                else {
                    valuesToDisplay[displayedFeature] = motif[jsonFeature];
                }
            }
            return valuesToDisplay;
        }
    };


    var getTitlesForDisplayedFeatures = function () {
        if (_displayedFeatures === null) {
            errorHandler.logError({
                "fileName": _fileName,
                "message": "motifLibrary must be created _displayedFeatures = null"
            });
            return [];
        } else {
            return Object
                .keys(_displayedFeatures)
                .map(
                    function(key) {
                        return _displayedFeatures[key];
                    }
                );
        }
    };


    var getUnitByName = function (motifName) {
        if (inLibrary(motifName)) {
            if (_library[motifName].status === "promised") {
                errorHandler.logError({"fileName": _fileName, "message": "Motif status: promised. The result" +
                " will be updated right after promise completion."});
            } else {
                return _library[motifName];
            }
        } else {
            errorHandler.logError({"fileName": _fileName, "message": "motif not in the library"});
        }
    };


    var getMotifFeaturesForTable = function (motifName) {
        return _featuresForTableLibrary[motifName];
    };


    var getUnits = function (motifNameList) {
        return $.map(motifNameList, getUnitByName);
    };


    var getUserRequestedUnits = function (userRequestedNames) {
        return getUnits(userRequestedNames);
    };


    var showLibrary = function () {
        console.log(_library);
    };


    return {
        showLibrary: showLibrary, //used for debug

        create: create,
        addUnit: addUnit,
        getUserRequestedMotifUnits: getUserRequestedUnits,

        getMotifFeaturesForTable: getMotifFeaturesForTable,
        getTitlesForDisplayedFeatures: getTitlesForDisplayedFeatures
    };
}());