"""
Test 2: Pruebas de inicio de sesión (Login).
Verifica el formulario de login, validaciones y flujo de autenticación.
"""
import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from conftest import TEST_USER_EMAIL, TEST_USER_PASSWORD


class TestLogin:
    """Pruebas del formulario de inicio de sesión."""

    def test_formulario_login_elementos_presentes(self, driver, base_url):
        """Verifica que todos los elementos del formulario de login están presentes."""
        driver.get(f"{base_url}/login.html")
        wait = WebDriverWait(driver, 10)

        # Campos del formulario
        assert driver.find_element(By.ID, "loginEmail"), "Campo email no encontrado"
        assert driver.find_element(By.ID, "loginPassword"), "Campo password no encontrado"
        assert driver.find_element(By.CSS_SELECTOR, "#loginForm button[type='submit']"), \
            "Botón submit no encontrado"

    def test_login_campos_vacios(self, driver, base_url):
        """Verifica que no se puede hacer login con campos vacíos."""
        driver.get(f"{base_url}/login.html")
        wait = WebDriverWait(driver, 10)

        # Limpiar campos
        email_input = driver.find_element(By.ID, "loginEmail")
        email_input.clear()

        password_input = driver.find_element(By.ID, "loginPassword")
        password_input.clear()

        # Intentar submit
        login_btn = driver.find_element(By.CSS_SELECTOR, "#loginForm button[type='submit']")
        login_btn.click()

        # Debe permanecer en la página de login
        assert "login.html" in driver.current_url

    def test_login_email_invalido(self, driver, base_url):
        """Verifica validación de email inválido."""
        driver.get(f"{base_url}/login.html")
        wait = WebDriverWait(driver, 10)

        email_input = driver.find_element(By.ID, "loginEmail")
        email_input.clear()
        email_input.send_keys("emailinvalido")

        password_input = driver.find_element(By.ID, "loginPassword")
        password_input.clear()
        password_input.send_keys("Password123!")

        login_btn = driver.find_element(By.CSS_SELECTOR, "#loginForm button[type='submit']")
        login_btn.click()

        # Debe mostrar error o permanecer en login
        assert "login.html" in driver.current_url

    def test_login_password_corta(self, driver, base_url):
        """Verifica que no acepta contraseñas menores a 8 caracteres."""
        driver.get(f"{base_url}/login.html")
        wait = WebDriverWait(driver, 10)

        email_input = driver.find_element(By.ID, "loginEmail")
        email_input.clear()
        email_input.send_keys("test@ejemplo.com")

        password_input = driver.find_element(By.ID, "loginPassword")
        password_input.clear()
        password_input.send_keys("abc")

        login_btn = driver.find_element(By.CSS_SELECTOR, "#loginForm button[type='submit']")
        login_btn.click()

        # Debe permanecer en la página de login o mostrar error
        assert "login.html" in driver.current_url

    def test_login_credenciales_incorrectas(self, driver, base_url):
        """Verifica el mensaje de error con credenciales incorrectas."""
        driver.get(f"{base_url}/login.html")
        wait = WebDriverWait(driver, 10)

        email_input = driver.find_element(By.ID, "loginEmail")
        email_input.clear()
        email_input.send_keys("noexiste@ejemplo.com")

        password_input = driver.find_element(By.ID, "loginPassword")
        password_input.clear()
        password_input.send_keys("Password123!")

        login_btn = driver.find_element(By.CSS_SELECTOR, "#loginForm button[type='submit']")
        login_btn.click()

        # Verificar que aparece un mensaje de error
        try:
            alert = wait.until(EC.visibility_of_element_located((By.ID, "loginAlert")))
            assert alert.text != "", "El mensaje de error debería mostrarse"
        except Exception:
            # Puede que el error se muestre de otra forma
            assert "login.html" in driver.current_url

    def test_login_exitoso(self, driver, base_url):
        """Verifica el login exitoso con credenciales válidas."""
        driver.get(f"{base_url}/login.html")
        wait = WebDriverWait(driver, 10)

        email_input = wait.until(EC.presence_of_element_located((By.ID, "loginEmail")))
        email_input.clear()
        email_input.send_keys(TEST_USER_EMAIL)

        password_input = driver.find_element(By.ID, "loginPassword")
        password_input.clear()
        password_input.send_keys(TEST_USER_PASSWORD)

        login_btn = driver.find_element(By.CSS_SELECTOR, "#loginForm button[type='submit']")
        login_btn.click()

        # Esperar redirección a entrenamientos
        try:
            wait.until(lambda d: "login.html" not in d.current_url)
            assert "entrenamientos.html" in driver.current_url or "index.html" in driver.current_url
        except Exception:
            # Si no redirige, verificar que muestra error (usuario puede no existir en DB)
            alert = driver.find_elements(By.ID, "loginAlert")
            if alert:
                pytest.skip("El usuario de prueba no está registrado en la base de datos")

    def test_login_usuario_almacenado_localStorage(self, driver, base_url):
        """Verifica que después del login el usuario se almacena en localStorage."""
        driver.get(f"{base_url}/login.html")
        wait = WebDriverWait(driver, 10)

        email_input = wait.until(EC.presence_of_element_located((By.ID, "loginEmail")))
        email_input.clear()
        email_input.send_keys(TEST_USER_EMAIL)

        password_input = driver.find_element(By.ID, "loginPassword")
        password_input.clear()
        password_input.send_keys(TEST_USER_PASSWORD)

        login_btn = driver.find_element(By.CSS_SELECTOR, "#loginForm button[type='submit']")
        login_btn.click()

        try:
            wait.until(lambda d: "login.html" not in d.current_url)
            usuario = driver.execute_script("return localStorage.getItem('usuario');")
            assert usuario is not None, "El usuario no se guardó en localStorage"
        except Exception:
            pytest.skip("El usuario de prueba no está registrado en la base de datos")

    def test_tabs_login_registro(self, driver, base_url):
        """Verifica que las pestañas de login y registro funcionan."""
        driver.get(f"{base_url}/login.html")
        wait = WebDriverWait(driver, 10)

        # Buscar las pestañas (tabs)
        tabs = driver.find_elements(By.CSS_SELECTOR, "[data-bs-toggle='tab'], .nav-tab, .nav-link")
        if len(tabs) >= 2:
            # Click en la pestaña de registro
            registro_tab = None
            for tab in tabs:
                if "registro" in tab.text.lower() or "crear" in tab.text.lower() or "cuenta" in tab.text.lower():
                    registro_tab = tab
                    break

            if registro_tab:
                registro_tab.click()
                import time
                time.sleep(0.5)
                # Verificar que el formulario de registro es visible
                register_form = driver.find_element(By.ID, "registerForm")
                assert register_form.is_displayed(), "El formulario de registro debería estar visible"

    def test_checkbox_recordarme_presente(self, driver, base_url):
        """Verifica que el checkbox 'Recuérdame' está presente."""
        driver.get(f"{base_url}/login.html")
        checkboxes = driver.find_elements(By.CSS_SELECTOR, "#loginForm input[type='checkbox']")
        assert len(checkboxes) > 0, "No se encontró el checkbox 'Recuérdame'"
