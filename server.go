package main

import (
	"net/http"
	"html/template"
)

func handler(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, r.URL.Path[1:])
	t, _ := template.ParseFiles("index.html")
	t.Execute(w, nil)
}

func main() {
	http.HandleFunc("/", handler)	
	http.ListenAndServe(":8080", nil)
}