import React, { useEffect, useState } from 'react';
import L, { Map as LeafletMap } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './styles.css'; // Import des styles

// Typage des lieux
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

    useEffect(() => {
        // Charger les données depuis le fichier JSON
        fetch('/locations.json')
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Erreur lors du chargement des données');
                }
                return response.json();
            })
            .then((data: Location[]) => setLocations(data))
            .catch((error) => console.error('Erreur :', error));

        // Initialiser la carte
        if (!map) {
            map = L.map('map', {
                crs: L.CRS.Simple,
                minZoom: -2,
                zoomControl: false,
            }).setView([500, 500], 0);

            // Ajouter l'image de la carte comme fond
            const bounds: L.LatLngBoundsExpression = [[0, 0], [1000, 1000]]; // Dimensions de l'image
            L.imageOverlay('/map.png', bounds).addTo(map);
            map.fitBounds(bounds);
        }

        // Nettoyage lors du démontage
        return () => {
            if (map) {
                map.remove();
                map = null;
            }
        };
    }, []);

    useEffect(() => {
        // Mettre à jour les marqueurs en fonction de l'époque actuelle
        if (map) {
            // Supprimer l'ancien groupe de marqueurs
            if (markersLayer) {
                map.removeLayer(markersLayer);
            }

            // Créer un nouveau groupe de marqueurs
            const newMarkersLayer = L.layerGroup();

            locations
                .filter((location) => currentEpoch >= location.epochStart && currentEpoch <= location.epochEnd)
                .forEach((location) => {
                    L.marker([location.x, location.y])
                        .addTo(newMarkersLayer)
                        .bindPopup(`<b>${location.name}</b><br>Époque : ${location.epochStart} - ${location.epochEnd}`);
                });

            newMarkersLayer.addTo(map);
            setMarkersLayer(newMarkersLayer); // Mettre à jour la couche actuelle
        }
    }, [locations, currentEpoch]);

    return (
        <div id="map-container">
            {/* Boîte des paramètres */}
            <div className="controls">
                <label htmlFor="epoch-selector">Époque actuelle : {currentEpoch}</label>
                <input
                    id="epoch-selector"
                    type="range"
                    min="0"
                    max="5000"
                    value={currentEpoch}
                    onChange={(e) => setCurrentEpoch(parseInt(e.target.value, 10))}
                />
            </div>
            {/* Conteneur de la carte */}
            <div id="map"></div>
        </div>
    );
};

export default Map;
