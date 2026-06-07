from flask import Flask, request, jsonify
from flask_cors import CORS
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
import pickle
import numpy as np
from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)
CORS(app)


# Set up Spotify API credentials
sp = spotipy.Spotify(auth_manager=SpotifyClientCredentials(
    client_id=os.getenv('SPOTIFY_CLIENT_ID'),
    client_secret=os.getenv('SPOTIFY_CLIENT_SECRET')
))

# Load saved model files
with open('similarity_matrix.pkl', 'rb') as f:
    similarity_matrix = pickle.load(f)

with open('songs_df.pkl', 'rb') as f:
    df = pickle.load(f)

def get_spotify_data(song_name):
    results = sp.search(q=song_name, type='track',limit=1)
    tracks = results['tracks']['items']
    if not tracks:
        return None
    track = tracks[0]
    return {
        'name' : track['name'],
        'artist' : track['artists'][0]['name'],
        'album_cover': track['album']['images'][0]['url'] if track['album']['images'] else None,
        'spotify_url': track['external_urls']['spotify'],
        'preview_url': track.get('preview_url', None)
    }

# Get the requested song
@app.route('/recommend', methods=['GET'])
def recommend():
    song_name = request.args.get('song')

    if not song_name:
        return jsonify({"error": "No song name provided"}), 400
    
    if song_name not in df['song_name'].values:
        return jsonify({"error": "Song not found"}), 404

    idx = df[df['song_name'] == song_name].index[0]

    sim_scores = list(enumerate(similarity_matrix[idx]))
    sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)
    sim_scores = sim_scores[1:6]  # Get top 5 similar songs

    recs = []
    for i, score in sim_scores:
        song = df.iloc[i]['song_name']
        spotify_data = get_spotify_data(song)
        recs.append({
            'song': df.iloc[i]['song_name'],
            'genre': df.iloc[i]['genre'],
            'similarity_score': round(float(score), 2),
            'spotify': spotify_data
        })

    return jsonify({"recommendations": recs})

# Endpoint to search for songs by name
@app.route('/songs', methods=['GET'])
def get_songs():
    query = request.args.get('query', '')
    matches = df[df['song_name'].str.contains(query, case=False, na=False)]['song_name'].head(10).tolist()
    return jsonify({"songs": matches})

if __name__ == '__main__':
    app.run(debug=True)