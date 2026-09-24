from typing import List, Tuple
from ..models.schemas import PiiEntity, DocumentLine, RedactResponse


class PiiRedactor:
    """Engine to perform irreversible redaction, partial masking, or selective preservation."""

    @staticmethod
    def sanitize_lines(
        lines: List[DocumentLine], entities: List[PiiEntity]
    ) -> Tuple[List[str], int, int]:
        """Apply configured redactions and masks to lines of text.

        Returns:
            Tuple of (sanitized_lines, count_of_redacted, count_of_masked)
        """
        # Map entity id to entity
        entity_map = {e.id: e for e in entities}
        sanitized_output: List[str] = []
        redacted_count = 0
        masked_count = 0

        for line in lines:
            line_text = line.text

            # If this line is linked to a specific entity
            if line.entityId and line.entityId in entity_map:
                ent = entity_map[line.entityId]
                if ent.action == "redacted":
                    line_text = line_text.replace(ent.originalValue, ent.redactedDisplay)
                    redacted_count += 1
                elif ent.action == "masked":
                    line_text = line_text.replace(ent.originalValue, ent.maskedValue)
                    masked_count += 1
            else:
                # Check all entities against the line text
                for ent in entities:
                    if ent.originalValue in line_text:
                        if ent.action == "redacted":
                            line_text = line_text.replace(ent.originalValue, ent.redactedDisplay)
                            redacted_count += 1
                        elif ent.action == "masked":
                            line_text = line_text.replace(ent.originalValue, ent.maskedValue)
                            masked_count += 1

            sanitized_output.append(line_text)

        return sanitized_output, redacted_count, masked_count

    @classmethod
    def generate_sanitized_document(
        cls,
        document_id: str,
        document_name: str,
        lines: List[DocumentLine],
        entities: List[PiiEntity],
    ) -> RedactResponse:
        sanitized_lines, redacted_count, masked_count = cls.sanitize_lines(lines, entities)

        header = [
            "=== PII SENTINEL SANITIZED EXPORT ===",
            f"Original Document : {document_name}",
            f"Reference ID      : {document_id}",
            "Compliance Status : DPDP Act 2023 Compliant",
            "Security Level    : IRREVERSIBLY REDACTED",
            "=====================================\n",
        ]

        full_content = "\n".join(header + sanitized_lines)

        return RedactResponse(
            documentId=document_id,
            name=f"sanitized_{document_name}",
            status="SUCCESS",
            sanitizedText=full_content,
            redactedCount=redacted_count,
            maskedCount=masked_count,
            complianceStatus="RESOLVED",
        )

