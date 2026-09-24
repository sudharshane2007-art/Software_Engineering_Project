import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.verhoeff import validate_verhoeff, generate_verhoeff
from app.core.detector import PiiDetector
from app.core.redaction import PiiRedactor
from app.models.schemas import DocumentLine, PiiEntity, BoundingBox


def test_verhoeff_checksum():
    # Known valid Aadhaar numbers with correct Verhoeff check digits
    assert validate_verhoeff("483920195829") is True
    assert validate_verhoeff("234567890128") is False  # Invalid check digit
    cd = generate_verhoeff("99994105703")
    assert validate_verhoeff("99994105703" + cd) is True

    # Tampered numbers must fail
    assert validate_verhoeff("483920195820") is False


def test_pan_detection():
    detector = PiiDetector()
    line = "Candidate PAN Card Number: ABCPS8192K verified."
    entities = detector.detect_in_line(line, line_index=1, page_number=1)

    pan_entities = [e for e in entities if e.type == "pan"]
    assert len(pan_entities) == 1
    assert pan_entities[0].originalValue == "ABCPS8192K"
    assert pan_entities[0].maskedValue == "ABXXXXXX2K"
    assert pan_entities[0].isValidated is True


def test_aadhaar_detection_with_verhoeff():
    detector = PiiDetector()
    # Line with valid Aadhaar
    line = "Student UIDAI No: 4839 2019 5829 submitted."
    entities = detector.detect_in_line(line, line_index=1, page_number=1)

    aadhaar_entities = [e for e in entities if e.type == "aadhaar"]
    assert len(aadhaar_entities) == 1
    assert aadhaar_entities[0].maskedValue == "XXXX-XXXX-5829"

    # Line with random 12-digit number that fails Verhoeff
    invalid_line = "Random Account: 4839 2019 5820 not an aadhaar."
    entities_invalid = detector.detect_in_line(invalid_line, line_index=1, page_number=1)
    assert len([e for e in entities_invalid if e.type == "aadhaar"]) == 0


def test_driving_licence_detection():
    detector = PiiDetector()
    line = "Driving Licence Record: DL-0420180091823 issued by Delhi RTO."
    entities = detector.detect_in_line(line, line_index=1, page_number=1)

    dl_entities = [e for e in entities if e.type == "driving_licence"]
    assert len(dl_entities) == 1
    assert "DL-0420180091823" in dl_entities[0].originalValue


def test_redaction_and_masking():
    entities = [
        PiiEntity(
            id="ent-1",
            type="aadhaar",
            label="Aadhaar",
            originalValue="9999 4105 7033",
            maskedValue="XXXX-XXXX-7033",
            redactedDisplay="[REDACTED AADHAAR]",
            validationMethod="verhoeff_checksum",
            isValidated=True,
            confidence=0.99,
            boundingBox=BoundingBox(x=10, y=10, width=20, height=3, page=1),
            action="redacted",
            category="critical_gov_id",
        ),
        PiiEntity(
            id="ent-2",
            type="pan",
            label="PAN",
            originalValue="ABCPS8192K",
            maskedValue="ABXXXXXX2K",
            redactedDisplay="[REDACTED PAN]",
            validationMethod="pan_regex",
            isValidated=True,
            confidence=0.98,
            boundingBox=BoundingBox(x=10, y=20, width=20, height=3, page=1),
            action="masked",
            category="critical_gov_id",
        ),
    ]

    lines = [
        DocumentLine(text="Aadhaar: 9999 4105 7033", entityId="ent-1"),
        DocumentLine(text="PAN: ABCPS8192K", entityId="ent-2"),
    ]

    sanitized, red_count, mask_count = PiiRedactor.sanitize_lines(lines, entities)
    assert "[REDACTED AADHAAR]" in sanitized[0]
    assert "ABXXXXXX2K" in sanitized[1]
    assert red_count == 1
    assert mask_count == 1


if __name__ == "__main__":
    print("Running backend tests...")
    test_verhoeff_checksum()
    test_pan_detection()
    test_aadhaar_detection_with_verhoeff()
    test_driving_licence_detection()
    test_redaction_and_masking()
    print("ALL 5 TESTS PASSED SUCCESSFULLY! [PASS]")
