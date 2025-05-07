const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const currentCity = document.getElementById('currentCity');
const currentDate = document.getElementById('currentDate');
const currentIcon = document.getElementById('currentIcon');
const currentTemp = document.getElementById('currentTemp');
const currentDesc = document.getElementById('currentDesc');
const feelsLike = document.getElementById('feelsLike');
const humidity = document.getElementById('humidity');
const windSpeed = document.getElementById('windSpeed');
const pressure = document.getElementById('pressure');
const forecastCards = document.getElementById('forecastCards');
const hourlyForecast = document.getElementById('hourlyForecast');
const searchList = document.getElementById('searchList');
const errorModal = document.getElementById('errorModal');
const errorTitle = document.getElementById('errorTitle');
const errorMessage = document.getElementById('errorMessage');
const closeBtn = document.querySelector('.close-btn');
const citySuggestions = document.getElementById('citySuggestions');


const API_KEY = '2747785a3b7dcf87e50321b6f93f1b59';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

let recentSearches = JSON.parse(localStorage.getItem('recentSearches')) || [];
const metroCities = ['Bangalore', 'Chennai', 'Delhi', 'Mumbai', 'Kolkata', 'Hyderabad', 'Ahmedabad', 'Pune', 'Kochi', 'Jaipur', 'Surat', 'Coimbatore'];
const metroCitiesTrack = document.querySelector('.metro-cities-track');

document.addEventListener('DOMContentLoaded', () => {
    renderRecentSearches();
    setupEventListeners();
    fetchWeather('Ooty');// Default city
    updateMetroCitiesWeather();
    setInterval(updateMetroCitiesWeather, 15 * 60 * 1000);
    if (window.location.hash) {
        const section = window.location.hash.substring(1);
        showInfoSection(section);
    }  
});

function setupEventListeners() {
    // Existing search button and city input listeners
    searchBtn.addEventListener('click', handleSearch);
    cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    
    // Navigation links
    document.querySelectorAll('.nav-links a:not(.active)').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = this.getAttribute('href').substring(1); // Remove #
            showInfoSection(target);
        });
    });
    
    // Close buttons
    document.querySelectorAll('.close-info').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.info-section').classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    });
    
    // Close when clicking outside content
    document.querySelectorAll('.info-section').forEach(section => {
        section.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
        });
    });
    console.log('Nav links:', document.querySelectorAll('.nav-links a'));
document.querySelectorAll('.nav-links a').forEach(link => {
    console.log('Link:', link, 'Href:', link.getAttribute('href'));
});
}
    
  
function showInfoSection(sectionId) {
    // Hide all info sections first
    document.querySelectorAll('.info-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show the requested section
    const section = document.getElementById(`${sectionId}-info`);
    if (section) {
        section.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}


function handleSearch() {
    const city = cityInput.value.trim();
    if (!city) return;
    
    fetchWeather(city);
    cityInput.value = '';
}

async function fetchWeather(cityName) {
    // Show loading state
    currentCity.textContent = 'Loading...';
    currentTemp.textContent = '--°';
    currentDesc.textContent = '--';
    feelsLike.textContent = '--°';
    windSpeed.textContent = '-- km/h';
    humidity.textContent = '--%';
    pressure.textContent = '-- hPa';
    
    try {
        // Fetch current weather and forecast
        const [weatherResponse, forecastResponse] = await Promise.all([
            fetch(`${BASE_URL}/weather?q=${cityName}&units=metric&appid=${API_KEY}`),
            fetch(`${BASE_URL}/forecast?q=${cityName}&units=metric&appid=${API_KEY}`)
        ]);
        
        if (!weatherResponse.ok) throw new Error(await weatherResponse.text());
        if (!forecastResponse.ok) throw new Error(await forecastResponse.text());
        
        const weatherData = await weatherResponse.json();
        const forecastData = await forecastResponse.json();
        
    
        updateCurrentWeather(weatherData);
        updateForecast(forecastData);
        updateHourlyForecast(forecastData);
        addToRecentSearches(cityName);
        humidity.textContent = `${weatherData.main.humidity}%`;
        pressure.textContent = `${weatherData.main.pressure} hPa`;
        
    } catch (error) {
        console.error('Error fetching weather data:', error);
        showError('Error', 'Failed to fetch weather data. Please check the city name and try again.');
        humidity.textContent = '--%';
        pressure.textContent = '-- hPa';
    }
}

// Update Current Weather
function updateCurrentWeather(data) {
    const { name, dt, main, weather, wind, sys } = data;
    const { temp, feels_like, humidity, pressure } = main;
    const { description, icon } = weather[0];
    
    currentCity.textContent = `${name}, ${sys.country}`;
    currentDate.textContent = formatDate(dt);
    currentIcon.src = `https://openweathermap.org/img/wn/${icon}@2x.png`;
    currentTemp.textContent = `${Math.round(temp)}°C`;
    currentDesc.textContent = description.charAt(0).toUpperCase() + description.slice(1);
    
    feelsLike.textContent = `${Math.round(feels_like)}°C`;
    humidity.textContent = `${humidity}%`;
    windSpeed.textContent = `${Math.round(wind.speed * 3.6)} km/h`;
    pressure.textContent = `${pressure} hPa`;
}

// Update 5-Day Forecast
function updateForecast(data) {
    forecastCards.innerHTML = '';
    
    
    const dailyForecast = {};
    const today = new Date().toLocaleDateString();
    
    data.list.forEach(item => {
        const date = new Date(item.dt * 1000).toLocaleDateString();
        if (date === today) return;
        
        if (!dailyForecast[date]) {
            dailyForecast[date] = {
                temps: [],
                feels_like: [],
                icons: [],
                descriptions: [],
                dt: item.dt,
                humidity: [],
                wind: []
            };
        }
        
        dailyForecast[date].temps.push(item.main.temp);
        dailyForecast[date].feels_like.push(item.main.feels_like);
        dailyForecast[date].icons.push(item.weather[0].icon);
        dailyForecast[date].descriptions.push(item.weather[0].description);
        dailyForecast[date].humidity.push(item.main.humidity);
        dailyForecast[date].wind.push(item.wind.speed);
    });
    
  
    const forecastDays = Object.keys(dailyForecast).slice(0,7);
    
    forecastDays.forEach(date => {
        const dayData = dailyForecast[date];
        const maxTemp = Math.round(Math.max(...dayData.temps));
        const minTemp = Math.round(Math.min(...dayData.temps));
        const avgFeelsLike = Math.round(dayData.feels_like.reduce((a,b) => a+b, 0) / dayData.feels_like.length);
        const avgHumidity = Math.round(dayData.humidity.reduce((a,b) => a+b, 0) / dayData.humidity.length);
        const avgWind = (dayData.wind.reduce((a,b) => a+b, 0) / dayData.wind.length).toFixed(1);
    
        const iconCounts = {};
        const descCounts = {};
        dayData.icons.forEach((icon, index) => {
            iconCounts[icon] = (iconCounts[icon] || 0) + 1;
            const desc = dayData.descriptions[index];
            descCounts[desc] = (descCounts[desc] || 0) + 1;
        });
        
        const mostFrequentIcon = Object.keys(iconCounts).reduce((a, b) => 
            iconCounts[a] > iconCounts[b] ? a : b
        );
        
        const mostFrequentDesc = Object.keys(descCounts).reduce((a, b) => 
            descCounts[a] > descCounts[b] ? a : b
        );
        
        const forecastCard = document.createElement('div');
        forecastCard.className = 'forecast-card';
        forecastCard.innerHTML = `
            <div class="forecast-day">${formatDay(dayData.dt)}</div>
            <img class="forecast-icon" src="https://openweathermap.org/img/wn/${mostFrequentIcon}@2x.png" 
                 alt="${mostFrequentDesc}" title="${mostFrequentDesc}">
            <div class="forecast-temp">
                <span class="temp-max" title="Maximum temperature">${maxTemp}°</span>
                <span class="temp-min" title="Minimum temperature">${minTemp}°</span>
            </div>
            <div class="forecast-details">
                <div class="detail-item" title="Feels like">
                    <i class="fas fa-temperature-high"></i> ${avgFeelsLike}°
                </div>
                <div class="detail-item" title="Humidity">
                    <i class="fas fa-tint"></i> ${avgHumidity}%
                </div>
                <div class="detail-item" title="Wind speed">
                    <i class="fas fa-wind"></i> ${avgWind} m/s
                </div>
            </div>
        `;
        forecastCards.appendChild(forecastCard);
    });
}

// Update 24-Hour Forecast
function updateHourlyForecast(data) {
    hourlyForecast.innerHTML = '';
    
    // Get current hour to start the 24-hour forecast from now
    const now = new Date();
    const currentHour = now.getHours();
    
  
    const hourlyData = data.list
        .filter(item => {
            const forecastTime = new Date(item.dt * 1000);
            return forecastTime > now && 
                   forecastTime <= new Date(now.getTime() + 24 * 60 * 60 * 1000);
        })
        .sort((a, b) => a.dt - b.dt);
    
    
    const displayHours = hourlyData.length > 0 ? hourlyData : data.list.slice(0,8);
    
    displayHours.forEach(item => {
        const forecastTime = new Date(item.dt * 1000);
        const hour = forecastTime.getHours();
        const isDayTime = hour > 6 && hour < 20;
        
        const hourCard = document.createElement('div');
        hourCard.className = `hourly-card ${isDayTime ? 'day' : 'night'}`;
        hourCard.innerHTML = `
            <div class="hourly-time">${formatHour(item.dt)}</div>
            <img class="hourly-icon" src="https://openweathermap.org/img/wn/${item.weather[0].icon}.png" 
                 alt="${item.weather[0].description}">
            <div class="hourly-temp">${Math.round(item.main.temp)}°</div>
            <div class="hourly-details">
                <div class="hourly-feels" title="Feels like">
                    <i class="fas fa-temperature-high"></i> ${Math.round(item.main.feels_like)}°
                </div>
                <div class="hourly-precip">
                    ${item.pop ? `<i class="fas fa-umbrella"></i> ${Math.round(item.pop * 100)}%` : ''}
                </div>
            </div>
        `;
        hourlyForecast.appendChild(hourCard);
    });
}

// Recent Searches
function addToRecentSearches(city) {
    recentSearches = recentSearches.filter(item => 
        item.toLowerCase() !== city.toLowerCase()
    );
    recentSearches.unshift(city);
    if (recentSearches.length > 5) recentSearches.pop();
    localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
    renderRecentSearches();
}

function renderRecentSearches() {
    searchList.innerHTML = '';
    recentSearches.forEach(city => {
        const searchItem = document.createElement('div');
        searchItem.className = 'search-item';
        searchItem.textContent = city;
        searchItem.addEventListener('click', () => fetchWeather(city));
        searchList.appendChild(searchItem);
    });
}

// Error Handling
function showError(title, message) {
    errorTitle.textContent = title;
    errorMessage.textContent = message;
    errorModal.classList.add('active');
}

function formatDate(timestamp) {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

function formatDay(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
}

function formatHour(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
}
async function updateMetroCitiesWeather() {
    try {
        // Show loading state
        metroCitiesTrack.innerHTML = '<div class="loading-cities">Loading metro cities weather...</div>';
        
        // Fetch weather for all metro cities
        const weatherPromises = metroCities.map(city => 
            fetch(`${BASE_URL}/weather?q=${city}&units=metric&appid=${API_KEY}`)
                .then(res => res.ok ? res.json() : Promise.reject(res.statusText))
        );
        
        const citiesData = await Promise.all(weatherPromises);
        
        // Clear loading state
        metroCitiesTrack.innerHTML = '';
        
        // Create and append city cards
        citiesData.forEach(cityData => {
            const cityCard = createMetroCityCard(cityData);
            metroCitiesTrack.appendChild(cityCard);
        });
        
        // Adjust animation duration based on number of cities
        const totalWidth = Array.from(metroCitiesTrack.children).reduce(
            (sum, card) => sum + card.offsetWidth + 20, 0
        );
        const duration = Math.max(60, Math.floor(totalWidth / 50)); // 50px per second
        
        metroCitiesTrack.style.animationDuration = `${duration}s`;
        
    } catch (error) {
        console.error('Error fetching metro cities weather:', error);
        metroCitiesTrack.innerHTML = `
            <div class="error-cities">
                <i class="fas fa-exclamation-triangle"></i>
                <span>Weather updates temporarily unavailable</span>
            </div>
        `;
    }
}

// Function to create a metro city card
function createMetroCityCard(cityData) {
    const card = document.createElement('div');
    card.className = 'metro-city-card';
    
    
    const { name, main, weather } = cityData;
    const { temp } = main;
    const { description, icon } = weather[0];
  
    card.innerHTML = `
        <div class="metro-city-name">
            <i class="fas fa-city"></i>
            <span>${name}</span>
        </div>
        <div class="metro-city-weather">
            <div class="metro-city-temp">${Math.round(temp)}°</div>
            <img class="metro-city-icon" src="https://openweathermap.org/img/wn/${icon}.png" alt="${description}">
        </div>
        <div class="metro-city-desc">${description}</div>
    `;
    
    return card;
}
document.getElementById('contact-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    // Add form submission logic here
    alert('Thank you for your message! We will get back to you soon.');
    document.getElementById('contact-info').classList.remove('active');
});
document.querySelectorAll('.map-type').forEach(type => {
    type.addEventListener('click', () => {
        document.querySelectorAll('.map-type').forEach(t => t.classList.remove('active'));
        type.classList.add('active');
        const mapType = type.dataset.type;
        document.getElementById('map-image').src = `https://maps.openweathermap.com/maps/2.0/weather/${mapType.toUpperCase()}2/0/0/0?appid=${API_KEY}`;
    });
});