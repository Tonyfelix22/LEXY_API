from abc import ABC, abstractmethod
from typing import Dict, Any, List

class ReportStrategy(ABC):
    """
    Abstract base class for all report strategies.
    """

    @abstractmethod
    def get_name(self) -> str:
        """Returns the unique name/identifier of the report."""
        pass

    @abstractmethod
    def get_display_name(self) -> str:
        """Returns the human-readable name of the report."""
        pass

    @abstractmethod
    def get_category(self) -> str:
        """Returns the category (FINANCE, HR, AUDIT)."""
        pass

    @abstractmethod
    def get_parameters(self) -> List[Dict[str, Any]]:
        """
        Returns a list of parameter definitions for the frontend.
        Example:
        [
            {"name": "start_date", "type": "date", "label": "Start Date", "required": True},
            {"name": "department_id", "type": "select", "label": "Department", "options": [...]},
        ]
        """
        pass

    @abstractmethod
    def generate_data(self, params: Dict[str, Any]) -> Any:
        """
        Executes the logic to fetch data based on parameters.
        Returns the raw data (e.g., list of dicts, pandas dataframe).
        """
        pass
