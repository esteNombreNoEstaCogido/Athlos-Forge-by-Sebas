"""
Configuración global de pytest y fixtures compartidas para las pruebas de Selenium.
Athlos Forge - Suite de pruebas automatizadas.
"""
import pytest
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

# URL base del proyecto (XAMPP local)
BASE_URL = "http://localhost/Athlos%20Forge%20by%20Sebas"

# Credenciales de prueba
TEST_USER_EMAIL = "test_selenium@athlos.com"
TEST_USER_PASSWORD = "Test1234!"


@pytest.fixture(scope="session")
def driver():
    """Crea una instancia del navegador Chrome para toda la sesión de pruebas."""
    chrome_options = Options()
    chrome_options.add_argument("--start-maximized")
    chrome_options.add_argument("--disable-notifications")
    chrome_options.add_argument("--disable-popup-blocking")
    # Descomentar para ejecución sin interfaz gráfica:
    # chrome_options.add_argument("--headless=new")

    service = Service(ChromeDriverManager().install())
    navegador = webdriver.Chrome(service=service, options=chrome_options)
    navegador.implicitly_wait(10)

    yield navegador

    navegador.quit()


@pytest.fixture
def base_url():
    """Retorna la URL base del proyecto."""
    return BASE_URL


def limpiar_local_storage(driver):
    """Limpia el localStorage del navegador."""
    driver.execute_script("window.localStorage.clear();")
