import React, { useEffect, useState } from 'react';
import L, { Icon, Map as LeafletMap } from 'leaflet';
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
	link: string;
	description: string;
}

const iconOptions = {
	iconSize: [70, 70] as [number, number],
	iconAnchor: [35, 70] as [number, number],
	popupAnchor: [0, -70] as [number, number],
	shadowSize: [25, 25] as [number, number]
};

const blankIcon = new Icon({
	iconUrl: '/icons/blankPin.png', ...iconOptions
});

const caliceIcon = new Icon({
	iconUrl: '/icons/calice.png', ...iconOptions
});

const castleIcon = new Icon({
	iconUrl: '/icons/castle.png', ...iconOptions
});

const communityIcon = new Icon({
	iconUrl: '/icons/community.png', ...iconOptions
});

const crownIcon = new Icon({
	iconUrl: '/icons/crown.png', ...iconOptions
});

const villageIcon = new Icon({
	iconUrl: '/icons/village.png', ...iconOptions
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
	const [isFilterEnabled, setIsFilterEnabled] = useState<boolean>(false); // État de la checkbox
	const params = new URLSearchParams(window.location.search);
	const epochParam = params.get('epoch');
	const idParam = params.get('id');
	const urlWiki = 'https://mythorium.ebasson.fr/';


	useEffect(() => {
		if (epochParam) {
			const epoch = parseInt(epochParam, 10);
			if (!isNaN(epoch)) {
				setCurrentEpoch(epoch);
				setIsFilterEnabled(true);
			}
		}


		if (idParam) {
			const id = parseInt(idParam, 10);
			if (!isNaN(id)) {
				const location = locations.find(loc => loc.id === id);
				if (location) {
					map?.flyTo([location.x - 1000, location.y], 3, {
						animate: true, duration: 0.5,
					});
					showLocationDetails(location);
				}
			}
		}
	}, [locations]);

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
		// Initialize the map
		if (!map) {
			console.log('Initializing the map...');

			// Define bounds and center
			const bounds: L.LatLngBoundsExpression = [[-4096, -4096], [4096, 4096]];
			const center: L.LatLngExpression = [-500, 500];

			map = L.map('map', {
				crs: L.CRS.Simple, minZoom: 0, maxZoom: 3, zoomControl: false, // Disable zoom buttons
			});

			// Add tiles
			L.tileLayer('/worldMap/tiles/{z}/{x}/{y}.png', {
				tileSize: 128, minZoom: 0, maxZoom: 3, noWrap: true, bounds: bounds,
			}).addTo(map);

			// Restrict the view within the bounds
			map.setMaxBounds(L.latLngBounds(bounds));

			// Center the map
			map.setView(center, 0); // Set the initial view to the center

			console.log('Map initialized.');
		}

		if (map && locations.length > 0) {
			if (markersLayer) {
				map.removeLayer(markersLayer);
			}

			const newMarkersLayer = L.layerGroup();

			locations.forEach((location) => {
				const markerIcon = getMarkerIcon(location.marker);
				const marker = L.marker([location.x, location.y], {icon: markerIcon});

				// Add click event to recenter the map
				marker.on('click', () => {
					map?.flyTo([location.x, location.y], 3, {
						animate: true, duration: 0.5, // Smooth animation
					});
					showLocationDetails(location);
				});

				marker
					.addTo(newMarkersLayer)
					.bindPopup(`<b>${location.name}</b>`)
					.getElement()
					?.classList.add(!isFilterEnabled || (currentEpoch >= location.epochStart && currentEpoch <= location.epochEnd) ? 'display-block' : 'display-none');
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
							const isVisible = !isFilterEnabled || (currentEpoch >= location.epochStart && currentEpoch <= location.epochEnd);
							element.classList.toggle('display-block', isVisible);
							element.classList.toggle('display-none', !isVisible);
						}
					}
				}
			});
		}
	}, [currentEpoch, markersLayer, locations, isFilterEnabled]);

	const showLocationDetails = (location: Location) => {
		const detailsContainer = document.getElementById('location-details');
		if (detailsContainer) {
			const fullUrl = `${urlWiki}${location.link}`; // Construire l'URL complète
			detailsContainer.innerHTML = `
				<div class="controls infos">
					<span class="close-button" id="close-button">&times;</span>
					<h1>${location.name}</h1>
					<p class="epoch"><i>Époque : ${location.epochStart} - ${location.epochEnd}</i></p>
					<p>${location.description}</p>
					<a href="${fullUrl}" target="_blank" class="btn-link">Lien vers le Wiki</a>
				</div>
			`;
		}
		document.getElementById('close-button')?.addEventListener('click', () => {
			document.getElementById('location-details')!.innerHTML = '';
		});
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

	const handleCheckboxChange = () => {
		setIsFilterEnabled(!isFilterEnabled);
	};

	return (<div id="map-container">
			<div className="controls params">
				<div className="epoch-block">
					<label className="epoch-checkbox">
						Filtre par époque
						<input className="epoch-checkbox-checkbox" type="checkbox" checked={isFilterEnabled}
							   onChange={handleCheckboxChange}/>
					</label>
					{isFilterEnabled && (<>
							<label htmlFor="epoch-selector" className="epoch-label">
								<div className="epoch-label-text">Époque actuelle :{' '}</div>
								<input id="epoch-input" type="number" min="0" max="5000"
									   value={currentEpoch === 0 ? '' : currentEpoch}
									   onChange={(e) => handleEpochInputChange(e.target.value)}
									   onFocus={(e) => e.target.value = ''}
									   title={`Époque actuelle : ${currentEpoch}`}
									   className="epoch-input"
								/>
							</label>
							<input id="epoch-selector" type="range" min="0" max="5000" value={currentEpoch}
								   onChange={(e) => setCurrentEpoch(parseInt(e.target.value, 10))}
								   className="epoch-selector"
							/>
						</>)}
				</div>
			</div>
			<div id="map"></div>
			<div id="location-details" style={{right: '20px', left: 'auto'}}></div>
		</div>);
};

export default Map;