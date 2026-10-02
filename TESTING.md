# Testing

The recommendation domain tests use Python's standard `unittest` runner:

```sh
cd apps/api
python -m unittest discover -s tests -v
```

These tests cover the drying-time humidity relationship, a low-rain recommendation, and rain arriving before the drying window ends. API integration, browser, accessibility, offline, and end-to-end tests remain to be added.
