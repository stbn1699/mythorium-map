import React, {useEffect, useState} from 'react';
import L, {Map as LeafletMap} from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './styles.css'; // Import des styles

interface Location {
    id: number;
    name: string;
    x: number;
    y: number;
    epochStart: number;
    epochEnd: number;
}

let map: LeafletMap | null = null; // Variable pour stocker l'instance de la carte

const Map: React.FC = () => {
    const [locations, setLocations] = useState<Location[]>([]);
    const [currentEpoch, setCurrentEpoch] = useState<number>(0); // Époque actuelle
    const [markersLayer, setMarkersLayer] = useState<L.LayerGroup | null>(null); // Groupe de couches pour les marqueurs
    const [urlIdProcessed, setUrlIdProcessed] = useState<boolean>(false); // État pour suivre si l'ID de l'URL a été traité

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const epochParam = params.get('epoch');
        if (epochParam) {
            const epoch = parseInt(epochParam, 10);
            if (!isNaN(epoch) && epoch >= 0 && epoch <= 5000) {
                setCurrentEpoch(epoch);
            }
        }
    }, []); // Exécuté une seule fois au chargement de la page

    useEffect(() => {
        fetch('/locations.json')
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Erreur lors du chargement des données');
                }
                return response.json();
            })
            .then((data: Location[]) => setLocations(data))
            .catch((error) => console.error('Erreur :', error));

        // Initialiser la carte sans les boutons de zoom
        if (!map) {
            map = L.map('map', {
                crs: L.CRS.Simple,
                minZoom: -1,
                maxZoom: 7,
                zoomControl: false, // Désactive les boutons de zoom/unzoom
            }).setView([500, 500], 0);

            const bounds: L.LatLngBoundsExpression = [[0, 0], [1000, 1000]];
            L.imageOverlay('/map.png', bounds).addTo(map);
            map.fitBounds(bounds);
        }

        return () => {
            if (map) {
                map.remove();
                map = null;
            }
        };
    }, []);

    useEffect(() => {
        if (map) {
            if (markersLayer) {
                map.removeLayer(markersLayer);
            }

            const newMarkersLayer = L.layerGroup();

            locations
                .filter((location) => currentEpoch >= location.epochStart && currentEpoch <= location.epochEnd)
                .forEach((location) => {
                    const marker = L.marker([location.x, location.y]);

                    // Ajouter un événement de clic pour recentrer la carte
                    marker.on('click', () => {
                        map?.flyTo([location.x, location.y], 3, {
                            animate: true,
                            duration: 0.5, // Animation fluide
                        });
                        showLocationDetails(location);
                    });

                    marker
                        .addTo(newMarkersLayer)
                        .bindPopup(`<b>${location.name}</b>`);
                });

            newMarkersLayer.addTo(map);
            setMarkersLayer(newMarkersLayer);

            // Vérifier si un ID de point est défini dans l'URL
            const params = new URLSearchParams(window.location.search);
            const locationIdParam = params.get('id');
            if (locationIdParam && !urlIdProcessed) {
                const locationId = parseInt(locationIdParam, 10);
                if (!isNaN(locationId)) {
                    const location = locations.find(loc => loc.id === locationId);
                    if (location) {
                        setCurrentEpoch(location.epochStart); // Mettre à jour l'état currentEpoch
                        setUrlIdProcessed(true); // Marquer l'ID comme traité pour éviter de boucler et ne pas pouvoir modifier l'époque
                        map.flyTo([location.x, location.y], 3, {
                            animate: true,
                            duration: 0.5, // Animation fluide
                        });
                        const existingMarker = newMarkersLayer.getLayers().find(layer => {
                            if (layer instanceof L.Marker) {
                                return layer.getLatLng().equals([location.x, location.y]);
                            }
                            return false;
                        });
                        if (existingMarker) {
                            existingMarker.openPopup();
                        }
                        showLocationDetails(location);
                    }
                }
            }
        }
    }, [locations, currentEpoch]);

    const showLocationDetails = (location: Location) => {
        const detailsContainer = document.getElementById('location-details');
        if (detailsContainer) {
            detailsContainer.innerHTML = `
        <div class="controls infos">
            <h3>${location.name}</h3>
            <p>Époque : ${location.epochStart} - ${location.epochEnd}</p>
        </div>
    `;
        }
        map?.on('click', () => {
            if (detailsContainer) {
                detailsContainer.innerHTML = '';
            }
        });
        map?.on('popupclose', () => {
            if (detailsContainer) {
                detailsContainer.innerHTML = '';
            }
        });
    };

    const handleEpochInputChange = (value: string) => {
        const epoch = parseInt(value, 10);
        if (!isNaN(epoch) && epoch >= 0 && epoch <= 5000) {
            setCurrentEpoch(epoch);
        }
    };

    return (
        <div id="map-container">
            <div className="controls params">
                <label htmlFor="epoch-selector">
                    Époque actuelle :{' '}
                    <input
                        id="epoch-input"
                        type="number"
                        min="0"
                        max="5000"
                        value={currentEpoch}
                        onChange={(e) => handleEpochInputChange(e.target.value)}
                        style={{
                            width: '80px',
                            padding: '5px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            textAlign: 'center',
                        }}
                    />
                </label>
                <input
                    id="epoch-selector"
                    type="range"
                    min="0"
                    max="5000"
                    value={currentEpoch}
                    onChange={(e) => setCurrentEpoch(parseInt(e.target.value, 10))}
                    style={{marginTop: '10px', width: '100%'}}
                />
            </div>
            <div id="map"></div>
            <div id="location-details" style={{right: '20px', left: 'auto'}}></div>
        </div>
    );
};

export default Map;