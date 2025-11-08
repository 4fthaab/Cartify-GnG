# services/weight_monitor.py
import time

# track last stable weight and mismatch state
last_weight = 0
alert_active = False
tolerance = 50      # ±50g
trigger_threshold = 200  # fraud detection if >200g diff

def process_weight_event(new_weight, last_known_weight=None):
    global last_weight, alert_active
    last_weight = last_known_weight or last_weight

    delta = abs(new_weight - last_weight)
    if delta >= trigger_threshold and not alert_active:
        alert_active = True
        print(f"🚨 ALERT! Sudden weight change detected: Δ={delta}g")
        # simulate buzzer start
        activate_beep()
        return {"alert": True, "delta_g": delta}
    elif alert_active and delta <= tolerance:
        # mismatch resolved
        alert_active = False
        deactivate_beep()
        print("✅ Weight stabilized, alert cleared.")
        return {"alert": False, "delta_g": delta}
    else:
        # normal variation
        return {"alert": alert_active, "delta_g": delta}

def activate_beep():
    print("🔊 [BEEP] Fraud alert active!")
    # On Raspberry Pi:
    # import RPi.GPIO as GPIO
    # GPIO.output(BUZZER_PIN, GPIO.HIGH)

def deactivate_beep():
    print("🔇 [BEEP OFF] Weight stable.")
    # On Raspberry Pi:
    # import RPi.GPIO as GPIO
    # GPIO.output(BUZZER_PIN, GPIO.LOW)
