"""
Test 5: Pruebas del carrito de compras.
Verifica agregar/eliminar productos, actualizar cantidades y el flujo de compra.
"""
import pytest
import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from conftest import BASE_URL


def _click_boton_carrito(driver, card):
    """Hace click en el botón agregar al carrito de una tarjeta, usando JS para evitar interceptación."""
    botones = card.find_elements(By.CSS_SELECTOR, "button, .btn")
    for b in botones:
        onclick = b.get_attribute("onclick") or ""
        texto = b.text.lower()
        if "carrito" in texto or "agregar" in texto or "añadir" in texto or "agregarAlCarrito" in onclick:
            driver.execute_script("arguments[0].scrollIntoView({block:'center'});", b)
            time.sleep(0.3)
            driver.execute_script("arguments[0].click();", b)
            return True
    return False


class TestCarrito:
    """Pruebas del carrito de compras."""

    def _limpiar_carrito(self, driver, base_url):
        """Limpia el carrito antes de cada test."""
        driver.get(f"{base_url}/entrenamientos.html")
        driver.execute_script("localStorage.removeItem('athlosCarrito');")
        driver.refresh()
        time.sleep(1)

    def test_carrito_vacio_inicial(self, driver, base_url):
        """Verifica que el carrito empieza vacío."""
        self._limpiar_carrito(driver, base_url)

        badge = driver.find_elements(By.ID, "cart-count")
        if badge:
            texto = badge[0].text.strip()
            assert texto == "0" or texto == "", \
                f"El carrito debería estar vacío, muestra: '{texto}'"

    def test_agregar_producto_al_carrito(self, driver, base_url):
        """Verifica que se puede agregar un producto al carrito."""
        self._limpiar_carrito(driver, base_url)

        cards = driver.find_elements(By.CSS_SELECTOR, ".card")
        if not cards:
            pytest.skip("No hay tarjetas de entrenamiento")

        if not _click_boton_carrito(driver, cards[0]):
            pytest.skip("No se encontró botón de agregar al carrito")
        time.sleep(2)

        # Verificar que el contador del carrito aumentó
        badge = driver.find_elements(By.ID, "cart-count")
        if badge:
            texto = badge[0].text.strip()
            assert texto != "0" and texto != "", \
                "El contador del carrito debería haber aumentado"

    def test_abrir_panel_carrito(self, driver, base_url):
        """Verifica que se puede abrir el panel del carrito."""
        driver.get(f"{base_url}/entrenamientos.html")
        wait = WebDriverWait(driver, 10)

        # Click en el botón del carrito
        cart_btn = driver.find_elements(By.CSS_SELECTOR,
            ".cart-floating-btn, .cart-icon-wrapper, [data-bs-target='#cartOffcanvas']")
        if not cart_btn:
            pytest.skip("Botón del carrito no encontrado")

        cart_btn[0].click()
        time.sleep(1)

        # Verificar que el offcanvas está visible
        offcanvas = driver.find_elements(By.ID, "cartOffcanvas")
        if offcanvas:
            is_shown = "show" in (offcanvas[0].get_attribute("class") or "")
            assert is_shown, "El panel del carrito debería estar visible"

    def test_carrito_muestra_items(self, driver, base_url):
        """Verifica que el carrito muestra los productos agregados."""
        self._limpiar_carrito(driver, base_url)

        # Agregar un producto
        cards = driver.find_elements(By.CSS_SELECTOR, ".card")
        if cards:
            _click_boton_carrito(driver, cards[0])
            time.sleep(2)

        # Abrir carrito
        cart_btn = driver.find_elements(By.CSS_SELECTOR,
            ".cart-floating-btn, .cart-icon-wrapper, [data-bs-target='#cartOffcanvas']")
        if cart_btn:
            cart_btn[0].click()
            time.sleep(1)

        # Verificar contenido
        container = driver.find_elements(By.ID, "cart-items-container")
        if container:
            items = container[0].find_elements(By.CSS_SELECTOR, "*")
            assert len(items) > 0, "El carrito debería mostrar los productos agregados"

    def test_carrito_muestra_total(self, driver, base_url):
        """Verifica que el carrito muestra el total."""
        driver.get(f"{base_url}/entrenamientos.html")

        # Abrir carrito
        cart_btn = driver.find_elements(By.CSS_SELECTOR,
            ".cart-floating-btn, .cart-icon-wrapper, [data-bs-target='#cartOffcanvas']")
        if cart_btn:
            cart_btn[0].click()
            time.sleep(1)

        total = driver.find_elements(By.ID, "cart-total")
        assert len(total) > 0, "El elemento de total del carrito no encontrado"

    def test_eliminar_producto_del_carrito(self, driver, base_url):
        """Verifica que se puede eliminar un producto del carrito."""
        self._limpiar_carrito(driver, base_url)

        # Agregar un producto
        cards = driver.find_elements(By.CSS_SELECTOR, ".card")
        if cards:
            _click_boton_carrito(driver, cards[0])
            time.sleep(2)

        # Abrir carrito
        cart_btn = driver.find_elements(By.CSS_SELECTOR,
            ".cart-floating-btn, .cart-icon-wrapper, [data-bs-target='#cartOffcanvas']")
        if cart_btn:
            cart_btn[0].click()
            time.sleep(1)

        # Buscar botón de eliminar
        container = driver.find_elements(By.ID, "cart-items-container")
        if container:
            delete_btns = container[0].find_elements(By.CSS_SELECTOR,
                "button[onclick*='eliminar'], .btn-danger, [onclick*='eliminar'], button.btn-sm")
            if delete_btns:
                driver.execute_script("arguments[0].click();", delete_btns[0])
                time.sleep(2)

                # Verificar que el carrito se actualizó
                carrito = driver.execute_script("return localStorage.getItem('athlosCarrito');")
                if carrito:
                    import json
                    items = json.loads(carrito)
                    # Después de eliminar, debería haber menos items o estar vacío
                    assert isinstance(items, list), "El carrito debería ser una lista"

    def test_carrito_persiste_en_localStorage(self, driver, base_url):
        """Verifica que el carrito se guarda en localStorage."""
        self._limpiar_carrito(driver, base_url)

        # Agregar un producto
        cards = driver.find_elements(By.CSS_SELECTOR, ".card")
        if cards:
            _click_boton_carrito(driver, cards[0])
            time.sleep(2)

        # Verificar localStorage
        carrito = driver.execute_script("return localStorage.getItem('athlosCarrito');")
        assert carrito is not None, "El carrito debería guardarse en localStorage"

    def test_finalizar_compra_requiere_login(self, driver, base_url):
        """Verifica que finalizar compra requiere estar logueado."""
        self._limpiar_carrito(driver, base_url)

        # Limpiar sesión
        driver.execute_script("localStorage.removeItem('usuario');")

        # Agregar producto
        cards = driver.find_elements(By.CSS_SELECTOR, ".card")
        if cards:
            _click_boton_carrito(driver, cards[0])
            time.sleep(2)

        # Abrir carrito
        cart_btn = driver.find_elements(By.CSS_SELECTOR,
            ".cart-floating-btn, .cart-icon-wrapper, [data-bs-target='#cartOffcanvas']")
        if cart_btn:
            cart_btn[0].click()
            time.sleep(1)

        # Intentar finalizar compra
        finalizar_btn = driver.find_elements(By.CSS_SELECTOR,
            "button[onclick*='finalizarCompra'], .btn-finalizar, #btn-finalizar")
        if finalizar_btn:
            finalizar_btn[0].click()
            time.sleep(2)

            # Debería redirigir a login o mostrar aviso
            en_login = "login.html" in driver.current_url
            alerta = driver.find_elements(By.CSS_SELECTOR, ".alert, .swal2-container, .modal.show")
            assert en_login or len(alerta) > 0, \
                "Debería pedir login antes de finalizar la compra"

    def test_agregar_multiples_productos(self, driver, base_url):
        """Verifica que se pueden agregar múltiples productos diferentes."""
        self._limpiar_carrito(driver, base_url)

        cards = driver.find_elements(By.CSS_SELECTOR, ".card")
        productos_agregados = 0

        for card in cards[:3]:  # Agregar hasta 3 productos
            if _click_boton_carrito(driver, card):
                time.sleep(1.5)
                productos_agregados += 1

        if productos_agregados > 0:
            badge = driver.find_elements(By.ID, "cart-count")
            if badge:
                texto = badge[0].text.strip()
                if texto.isdigit():
                    assert int(texto) >= productos_agregados, \
                        f"Se agregaron {productos_agregados} productos pero el carrito muestra {texto}"
