// photos/photos.js

import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from "../config.js";
import { db, ref } from "../js/firebase.js";
import {
    push, onValue, query, orderByChild
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const PHOTOS_REF = "photos";

// ── Subir foto a Cloudinary ────────────────────────────────

export async function uploadPhoto(file, onProgress) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("folder", "cumple");

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable && onProgress) {
                onProgress(Math.round((e.loaded / e.total) * 100));
            }
        });

        xhr.addEventListener("load", () => {
            const data = JSON.parse(xhr.responseText);
            if (data.secure_url) {
                resolve(data.secure_url);
            } else {
                reject(new Error("Error subiendo foto"));
            }
        });

        xhr.addEventListener("error", () => reject(new Error("Error de red")));

        xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`);
        xhr.send(formData);
    });
}

// ── Guardar URL en Firebase ────────────────────────────────

export async function savePhoto(url, authorName) {
    await push(ref(db, PHOTOS_REF), {
        url,
        author: authorName || "Anónimo",
        timestamp: Date.now(),
    });
}

// ── Escuchar fotos en tiempo real ──────────────────────────

export function watchPhotos(callback) {
    const photosQuery = query(
        ref(db, PHOTOS_REF),
        orderByChild("timestamp")
    );

    onValue(photosQuery, (snapshot) => {
        if (!snapshot.exists()) { callback([]); return; }
        const photos = [];
        snapshot.forEach((child) => {
            photos.push({ id: child.key, ...child.val() });
        });
        // Más nuevas primero
        photos.reverse();
        callback(photos);
    });
}