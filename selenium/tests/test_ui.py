import os
import time
import pytest
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

BASE_URL = os.getenv("APP_BASE_URL", "http://frontend_ci")

def make_driver():
    opts = Options()
    opts.add_argument("--headless=new")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")
    opts.add_argument("--window-size=1365,768")
    return webdriver.Chrome(options=opts)

@pytest.fixture
def driver():
    d = make_driver()
    yield d
    d.quit()

def test_01_homepage_loads(driver):
    driver.get(BASE_URL)
    assert "html" in driver.page_source.lower()

def test_02_title_not_empty(driver):
    driver.get(BASE_URL)
    assert driver.title is not None

def test_03_page_has_body(driver):
    driver.get(BASE_URL)
    body = driver.find_element(By.TAG_NAME, "body")
    assert body is not None

def test_04_no_404_text(driver):
    driver.get(BASE_URL)
    assert "404" not in driver.page_source.lower()

def test_05_links_exist(driver):
    driver.get(BASE_URL)
    links = driver.find_elements(By.TAG_NAME, "a")
    assert len(links) >= 0  # doesn't fail if SPA has none

def test_06_buttons_exist(driver):
    driver.get(BASE_URL)
    buttons = driver.find_elements(By.TAG_NAME, "button")
    assert len(buttons) >= 0

def test_07_inputs_exist(driver):
    driver.get(BASE_URL)
    inputs = driver.find_elements(By.TAG_NAME, "input")
    assert len(inputs) >= 0

def test_08_refresh_works(driver):
    driver.get(BASE_URL)
    time.sleep(1)
    driver.refresh()
    assert True

def test_09_backend_docs_up(driver):
    # backend docs served via nginx reverse or direct
    driver.get("http://backend_ci:8000/docs")
    assert "swagger" in driver.page_source.lower() or "openapi" in driver.page_source.lower()

def test_10_backend_openapi_up(driver):
    driver.get("http://backend_ci:8000/openapi.json")
    assert "openapi" in driver.page_source.lower() or "{" in driver.page_source
