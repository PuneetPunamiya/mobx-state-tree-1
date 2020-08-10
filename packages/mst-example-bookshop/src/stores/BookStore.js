import { values } from "mobx"
import { types, getParent, flow } from "mobx-state-tree"

export const Book = types.model("Book", {
    id: types.identifier,
    name: types.string,
    author: types.string,
    series_t: types.optional(types.string, ""),
    sequence_i: types.number,
    genre_s: types.string,
    pages_i: types.number,
    price: types.number,
    isAvailable: true
})

export const Tag = types.model({
    id: types.integer,
    name: types.string,
})

export const Category = types.model({
  id: types.optional(types.integer,1),
  name: types.optional(types.string,""),
  tags: types.optional(types.array(Tag), []),
});

export const BookStore = types
    .model("BookStore", {
        isLoading: true,
        books: types.map(Book),
        categories: types.map(Category),
    })
    .views((self) => ({
        get shop() {
            return getParent(self)
        },
        get cat() {
            return getParent(self)
        },
        get sortedAvailableBooks() {
            return sortBooks(values(self.books))
        }
    }))
    .actions((self) => {
        function markLoading(loading) {
            self.isLoading = loading
        }

        function updateBooks(json) {
            values(self.books).forEach((book) => (book.isAvailable = false))
            json.forEach((bookJson) => {
                self.books.put(bookJson)
                self.books.get(bookJson.id).isAvailable = true
            })
        }

        const loadBooks = flow(function* loadBooks() {
            try {
                const json = yield self.shop.fetch("/books.json")
                // console.log(json)
                updateBooks(json)
                markLoading(false)
            } catch (err) {
                console.error("Failed to load books ", err)
            }
        })

        const loadCategories = flow(function* loadCategories() {
            try {
                const json = yield self.cat.fetch("/data.json")
                console.log(json)
                // updateBooks(json)
                // markLoading(false)
            } catch (err) {
                console.error("Failed to load books ", err)
            }
        })

        return {
            updateBooks,
            loadBooks,
            loadCategories
        }
    })

function sortBooks(books) {
    return books
        .filter((b) => b.isAvailable)
        .sort((a, b) => (a.name > b.name ? 1 : a.name === b.name ? 0 : -1))
}
