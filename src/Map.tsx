import React, {useEffect, useState} from 'react';
import L, {Map as LeafletMap} from 'leaflet';
import {Icon} from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './styles.css'; // Import des styles

interface Location {
    id: number;
    name: string;
    x: number;
    y: number;
    epochStart: number;
    epochEnd: number;
    marker: string;
}

const iconOptions = {
    iconSize: [70, 70] as [number, number],
    iconAnchor: [35, 70] as [number, number],
    popupAnchor: [0, -70] as [number, number],
    shadowSize: [25, 25] as [number, number]
};

const blankIcon = new Icon({
    iconUrl: '/icons/blankPin.png',
    ...iconOptions
});

const caliceIcon = new Icon({
    iconUrl: '/icons/calice.png',
    ...iconOptions
});

const castleIcon = new Icon({
    iconUrl: '/icons/castle.png',
    ...iconOptions
});

const communityIcon = new Icon({
    iconUrl: '/icons/community.png',
    ...iconOptions
});

const crownIcon = new Icon({
    iconUrl: '/icons/crown.png',
    ...iconOptions
});

const villageIcon = new Icon({
    iconUrl: '/icons/village.png',
    ...iconOptions
});

const getMarkerIcon = (marker: string) => {
    switch (marker) {
        case 'calice':
            return caliceIcon;
        case 'castle':
            return castleIcon;
        case 'community':
            return communityIcon;
        case 'crown':
            return crownIcon;
        case 'village':
            return villageIcon;
        default:
            return blankIcon; // Default icon
    }
};

let map: LeafletMap | null = null; // Variable pour stocker l'instance de la carte

const Map: React.FC = () => {
    const [locations, setLocations] = useState<Location[]>([]);
    const [currentEpoch, setCurrentEpoch] = useState<number>(2500); // Époque actuelle (2500 par défaut)
    const [markersLayer, setMarkersLayer] = useState<L.LayerGroup | null>(null); // Groupe de couches pour les marqueurs

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
    }, []); // Exécuté une seule fois au chargement de la page

    useEffect(() => {
        // Initialiser la carte sans les boutons de zoom
        if (!map) {
            map = L.map('map', {
                crs: L.CRS.Simple,
                minZoom: 0,
                maxZoom: 5,
                zoomControl: false, // Désactive les boutons de zoom/unzoom
            }).setView([500, 500], 0);

            const bounds: L.LatLngBoundsExpression = [[0, 0], [1000, 1000]];
            L.imageOverlay('worldMap/8192.png', bounds).addTo(map);
            map.fitBounds(bounds);
        }

        if (map && locations.length > 0) {
            if (markersLayer) {
                map.removeLayer(markersLayer);
            }

            const newMarkersLayer = L.layerGroup();

            locations.forEach((location) => {
                const markerIcon = getMarkerIcon(location.marker);
                const marker = L.marker([location.x, location.y], { icon: markerIcon });

                // Add click event to recenter the map
                marker.on('click', () => {
                    map?.flyTo([location.x, location.y], 4, {
                        animate: true,
                        duration: 0.5, // Smooth animation
                    });
                    showLocationDetails(location);
                });

                marker
                    .addTo(newMarkersLayer)
                    .bindPopup(`<b>${location.name}</b>`)
                    .getElement()
                    ?.classList.add(currentEpoch >= location.epochStart && currentEpoch <= location.epochEnd ? 'display-block' : 'display-none');
            });

            newMarkersLayer.addTo(map);
            setMarkersLayer(newMarkersLayer);
        }

        return () => {
            if (map) {
                map.remove();
                map = null;
            }
        };
    }, [locations]);

    useEffect(() => {
        if (markersLayer) {
            markersLayer.eachLayer((layer) => {
                if (layer instanceof L.Marker) {
                    const location = locations.find(loc => loc.x === layer.getLatLng().lat && loc.y === layer.getLatLng().lng);
                    if (location) {
                        const element = layer.getElement();
                        if (element) {
                            element.classList.toggle('display-block', currentEpoch >= location.epochStart && currentEpoch <= location.epochEnd);
                            element.classList.toggle('display-none', !(currentEpoch >= location.epochStart && currentEpoch <= location.epochEnd));
                        }
                    }
                }
            });
        }
    }, [currentEpoch, markersLayer, locations]);

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
                        value={currentEpoch === 0 ? '' : currentEpoch}
                        onChange={(e) => handleEpochInputChange(e.target.value)}
                        onFocus={(e) => e.target.value = ''}
                        title={`Époque actuelle : ${currentEpoch}`}
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