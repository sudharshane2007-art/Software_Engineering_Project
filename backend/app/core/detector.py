import re
import uuid
from typing import List, Tuple
from .verhoeff import validate_verhoeff
from ..models.schemas import PiiEntity, BoundingBox, PiiType

# Indian State & Union Territory codes for Driving Licences
INDIAN_STATE_CODES = {
    'AN', 'AP', 'AR', 'AS', 'BR', 'CH', 'CG', 'DD', 'DL', 'DN',
    'GA', 'GJ', 'HR', 'HP', 'JH', 'JK', 'KA', 'KL', 'LA', 'LD',
    'MH', 'ML', 'MN', 'MP', 'MZ', 'NL', 'OD', 'PB', 'PY', 'RJ',
    'SK', 'TN', 'TR', 'TS', 'UK', 'UP', 'WB'
}

# 4th Character of PAN signifies entity status
PAN_STATUS_CHARS = {'P', 'C', 'H', 'F', 'A', 'T', 'B', 'L', 'J', 'G'}


class PiiDetector:
    """Robust pattern matching and checksum validation engine for Indian PII."""

    @staticmethod
    def mask_aadhaar(value: str) -> str:
        clean = "".join(filter(str.isdigit, value))
        if len(clean) >= 4:
            return f"XXXX-XXXX-{clean[-4:]}"
        return "XXXX-XXXX-XXXX"

    @staticmethod
    def mask_pan(value: str) -> str:
        clean = value.strip().upper()
        if len(clean) == 10:
            return f"{clean[:2]}XXXXXX{clean[-2:]}"
        return "XXXXXXXXXX"

    @staticmethod
    def mask_dl(value: str) -> str:
        clean = value.strip().upper()
        if len(clean) >= 6:
            return f"{clean[:4]}-XXXXXXX-{clean[-4:]}"
        return "DL-XXXXXXXXXXX"

    @staticmethod
    def mask_phone(value: str) -> str:
        digits = "".join(filter(str.isdigit, value))
        if len(digits) >= 10:
            last4 = digits[-4:]
            prefix = "+91 " if value.startswith("+") else ""
            return f"{prefix}XXXXX-XX{last4}"
        return "XXXXX-XXXXX"

    @staticmethod
    def mask_email(value: str) -> str:
        if "@" in value:
            name, domain = value.split("@", 1)
            if len(name) > 2:
                masked_name = name[0] + "*" * (len(name) - 2) + name[-1]
            else:
                masked_name = name[0] + "*"
            return f"{masked_name}@{domain}"
        return "******@domain.com"

    @staticmethod
    def mask_dob(value: str) -> str:
        parts = re.split(r'[-/.]', value.strip())
        if len(parts) == 3:
            return f"XX/XX/{parts[2]}"
        return "XX/XX/XXXX"

    def detect_in_line(
        self, text: str, line_index: int, page_number: int = 1, total_lines: int = 20
    ) -> List[PiiEntity]:
        """Detect all government and associated PII instances in a single line of text."""
        entities: List[PiiEntity] = []

        # Approximate line vertical percentage
        y_pos = min(92.0, max(5.0, (line_index / max(1, total_lines)) * 85.0 + 8.0))

        # 1. Aadhaar Number Detection (FR-06)
        # 12 digits, cannot start with 0 or 1, optional spaces or dashes
        aadhaar_matches = re.finditer(r'\b([2-9]{1}[0-9]{3}[ -]?[0-9]{4}[ -]?[0-9]{4})\b', text)
        for m in aadhaar_matches:
            raw_val = m.group(1)
            digits = "".join(filter(str.isdigit, raw_val))
            if len(digits) == 12 and validate_verhoeff(digits):
                x_pos = max(10.0, min(80.0, (m.start() / max(1, len(text))) * 70.0 + 15.0))
                entities.append(
                    PiiEntity(
                        id=f"ent-adh-{uuid.uuid4().hex[:6]}",
                        type="aadhaar",
                        label="UIDAI Aadhaar Number",
                        originalValue=raw_val,
                        maskedValue=self.mask_aadhaar(raw_val),
                        redactedDisplay="[REDACTED AADHAAR]",
                        validationMethod="verhoeff_checksum",
                        isValidated=True,
                        confidence=0.99,
                        boundingBox=BoundingBox(
                            x=round(x_pos, 1),
                            y=round(y_pos, 1),
                            width=24.0,
                            height=3.4,
                            page=page_number,
                        ),
                        action="unredacted",
                        category="critical_gov_id",
                    )
                )

        # 2. PAN Card Number Detection (FR-07)
        # 10 chars: 5 letters, 4 digits, 1 letter. 4th char is status char.
        pan_matches = re.finditer(r'\b([A-Z]{5}[0-9]{4}[A-Z]{1})\b', text)
        for m in pan_matches:
            raw_val = m.group(1)
            is_valid_type = raw_val[3] in PAN_STATUS_CHARS
            confidence = 0.98 if is_valid_type else 0.85
            x_pos = max(10.0, min(80.0, (m.start() / max(1, len(text))) * 70.0 + 15.0))
            entities.append(
                PiiEntity(
                    id=f"ent-pan-{uuid.uuid4().hex[:6]}",
                    type="pan",
                    label="Income Tax PAN Card",
                    originalValue=raw_val,
                    maskedValue=self.mask_pan(raw_val),
                    redactedDisplay="[REDACTED PAN]",
                    validationMethod="pan_regex",
                    isValidated=True,
                    confidence=confidence,
                    boundingBox=BoundingBox(
                        x=round(x_pos, 1),
                        y=round(y_pos, 1),
                        width=20.0,
                        height=3.4,
                        page=page_number,
                    ),
                    action="unredacted",
                    category="critical_gov_id",
                )
            )

        # 3. Driving Licence Detection (FR-08)
        # State Code (2 letters) + RTO Code (2 digits) + 11 digits
        dl_matches = re.finditer(
            r'\b(([A-Z]{2})[- ]?([0-9]{2})[- ]?([0-9]{11}))\b', text
        )
        for m in dl_matches:
            raw_val = m.group(1)
            state_code = m.group(2)
            if state_code in INDIAN_STATE_CODES:
                x_pos = max(10.0, min(80.0, (m.start() / max(1, len(text))) * 70.0 + 15.0))
                entities.append(
                    PiiEntity(
                        id=f"ent-dl-{uuid.uuid4().hex[:6]}",
                        type="driving_licence",
                        label="Indian Driving Licence",
                        originalValue=raw_val,
                        maskedValue=self.mask_dl(raw_val),
                        redactedDisplay="[REDACTED DL]",
                        validationMethod="dl_format",
                        isValidated=True,
                        confidence=0.96,
                        boundingBox=BoundingBox(
                            x=round(x_pos, 1),
                            y=round(y_pos, 1),
                            width=26.0,
                            height=3.4,
                            page=page_number,
                        ),
                        action="unredacted",
                        category="critical_gov_id",
                    )
                )

        # 4. Phone Number Detection (FR-09)
        # Indian numbers: starts with +91 or directly 6-9, 10 digits
        phone_matches = re.finditer(
            r'(\+91[\s-]?[6-9]\d{4}[\s-]?\d{5}|\b[6-9]\d{4}[\s-]?\d{5}\b)', text
        )
        for m in phone_matches:
            raw_val = m.group(1)
            # Avoid matching already matched Aadhaar sub-fragments
            if not any(raw_val in e.originalValue for e in entities):
                x_pos = max(10.0, min(80.0, (m.start() / max(1, len(text))) * 70.0 + 15.0))
                entities.append(
                    PiiEntity(
                        id=f"ent-ph-{uuid.uuid4().hex[:6]}",
                        type="phone",
                        label="Direct Mobile Number",
                        originalValue=raw_val,
                        maskedValue=self.mask_phone(raw_val),
                        redactedDisplay="[REDACTED PHONE]",
                        validationMethod="pattern",
                        isValidated=True,
                        confidence=0.94,
                        boundingBox=BoundingBox(
                            x=round(x_pos, 1),
                            y=round(y_pos, 1),
                            width=22.0,
                            height=3.2,
                            page=page_number,
                        ),
                        action="unredacted",
                        category="contact_info",
                    )
                )

        # 5. Email Detection (FR-09)
        email_matches = re.finditer(
            r'\b([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})\b', text
        )
        for m in email_matches:
            raw_val = m.group(1)
            x_pos = max(10.0, min(80.0, (m.start() / max(1, len(text))) * 70.0 + 15.0))
            entities.append(
                PiiEntity(
                    id=f"ent-em-{uuid.uuid4().hex[:6]}",
                    type="email",
                    label="Personal / Official Email",
                    originalValue=raw_val,
                    maskedValue=self.mask_email(raw_val),
                    redactedDisplay="[REDACTED EMAIL]",
                    validationMethod="pattern",
                    isValidated=True,
                    confidence=0.98,
                    boundingBox=BoundingBox(
                        x=round(x_pos, 1),
                        y=round(y_pos, 1),
                        width=28.0,
                        height=3.2,
                        page=page_number,
                    ),
                    action="unredacted",
                    category="contact_info",
                )
            )

        # 6. Date of Birth Detection (FR-09)
        dob_matches = re.finditer(
            r'\b((?:0[1-9]|[12][0-9]|3[01])[-/.](?:0[1-9]|1[012])[-/.](?:19|20)\d\d)\b', text
        )
        for m in dob_matches:
            raw_val = m.group(1)
            x_pos = max(10.0, min(80.0, (m.start() / max(1, len(text))) * 70.0 + 15.0))
            entities.append(
                PiiEntity(
                    id=f"ent-dob-{uuid.uuid4().hex[:6]}",
                    type="dob",
                    label="Date of Birth",
                    originalValue=raw_val,
                    maskedValue=self.mask_dob(raw_val),
                    redactedDisplay="[REDACTED DOB]",
                    validationMethod="pattern",
                    isValidated=True,
                    confidence=0.92,
                    boundingBox=BoundingBox(
                        x=round(x_pos, 1),
                        y=round(y_pos, 1),
                        width=18.0,
                        height=3.2,
                        page=page_number,
                    ),
                    action="unredacted",
                    category="personal_detail",
                )
            )

        return entities

